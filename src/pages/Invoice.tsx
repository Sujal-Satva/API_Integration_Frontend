
import React, { useState, useEffect } from "react";
import {
  Typography, Input, Button, Form, message, Card,
  Space, Table, Tag, Popconfirm, Tooltip, Divider, Select,
  TablePaginationConfig
} from "antd";
import {
  SyncOutlined, PlusOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, UploadOutlined
} from "@ant-design/icons";
import moment from "moment";
import { SorterResult, TableCurrentDataSource } from "antd/lib/table/interface";

// Components
import InvoiceViewModal from "../components/InvoiceViewModal";
import InvoiceFormDrawer from "../components/InvoiceFormDrawer";
import UploadInvoiceModal from "../components/UploadInvoiceModal";

// Services
import { invoiceService } from "../services/invoiceService";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";

// Types
import {
  Invoice, Customer, Product, LineItem,
  PaginationParams, SorterParams, InvoiceFormValues
} from "../interfaces";
import { useAuth } from "../context/AuthContext";
import { values } from "lodash";

const { Title } = Typography;
const { Option } = Select;


interface InvoiceTotal {
  subtotal: number;
  total: number;
}

const calculateInvoiceTotal = (items: LineItem[]): InvoiceTotal => {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate || 0), 0);
  return { subtotal, total: subtotal }; // Add tax calculation if needed
};

export const InvoicePage: React.FC = () => {
  const [form] = Form.useForm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineItemsError, setLineItemsError] = useState<string>("");


  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [savingInvoice, setSavingInvoice] = useState<boolean>(false);
  // const [syncingInvoices, setSyncingInvoices] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [viewModalVisible, setViewModalVisible] = useState<boolean>(false);
  // const [uploadModalVisible, setUploadModalVisible] = useState<boolean>(false);

  // Selected invoice for operations
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Filtering and pagination
  const [searchText, setSearchText] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: ["10", "20", "50"],
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  });
  const [sorter, setSorter] = useState<SorterResult<any>>({
    field: "createdAt",
    order: "descend",
  });

  // Data fetching
  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadInvoices();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAllCustomer(
        1, 10, "", "displayName", "asc", "all", true, false
      );

      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      message.error("Failed to load customers");
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts(1, 10, "", "displayName", "asc", "all", true, "all", false);
      setProducts(response.data.data.filter((item) => item.isActive) || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      message.error("Failed to load products");
    }
  };

  const loadInvoices = async (
    page: number = pagination.current as number,
    pageSize: number = pagination.pageSize as number,
    sortField: string = sorter.field as string,
    sortOrder: string = sorter.order === "ascend" ? "asc" : "desc",
    search: string = searchText,
    source: string = sourceFilter
  ) => {
    setLoading(true);
    try {
      const response = await invoiceService.getAllInvoices(
        page, pageSize, search, sortField, sortOrder, true, source
      );

      // Ensure we're correctly handling the API response
      if (response && response.data) {
        setInvoices(response.data.data || []);
        setPagination({
          ...pagination,
          current: response.data.page || page,
          pageSize: response.data.pageSize || pageSize,
          total: response.data.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, any>,
    sorter: SorterResult<any>,
    _: TableCurrentDataSource<any>
  ) => {
    const sortField = sorter.field || "createdAt";
    const sortOrder = sorter.order || "descend";

    setSorter({ field: sortField, order: sortOrder });
    setPagination({
      ...newPagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });

    loadInvoices(
      newPagination.current as number,
      newPagination.pageSize as number,
      sortField as string,
      sorter.order === "ascend" ? "asc" : "desc",
      searchText,
      sourceFilter
    );
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadInvoices(
      1,
      pagination.pageSize as number,
      sorter.field as string,
      sorter.order === "ascend" ? "asc" : "desc",
      searchText,
      sourceFilter
    );
  };

  const handleSourceFilterChange = (value: string) => {
    setSourceFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadInvoices(
      1,
      pagination.pageSize as number,
      sorter.field as string,
      sorter.order === "ascend" ? "asc" : "desc",
      searchText,
      value
    );
  };


  // Invoice form operations
  const validateLineItems = (): boolean => {
    if (lineItems.length === 0) {
      setLineItemsError("Please add at least one item to the invoice");
      return false;
    }

    const invalidItems = lineItems.filter(
      item => !item.productId || item.quantity < 0
    );

    if (invalidItems.length > 0) {
      setLineItemsError("All line items must have a product and valid quantity");
      return false;
    }

    setLineItemsError("");
    return true;
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.externalId === customerId);

    if (customer) {
      form.setFieldsValue({
        customerName: customer.displayName || customer.customerName,
        addresses: [{
          line1: customer.addressLine1,
          city: customer.city || "",
          region: customer.region || "",
          postalCode: customer.postalCode || "",
          country: customer.country || "",
          type: "Billing"
        }],
        customerEmail: customer.emailAddress
      });
    }
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      productId: undefined,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
    setLineItemsError("");
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "productId") {
      const product = products.find(p => p.externalId == value);
      if (product) {
        updated[index].description = product.description;
        updated[index].rate = product.salesUnitPrice;
        updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
      }
    }
    if (field === "quantity" || field === "rate") {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
    }

    setLineItems(updated);
  };

  // Drawer operations
  const openDrawerToCreate = () => {
    setEditingInvoice(null);
    setLineItems([]);
    setLineItemsError("");
    form.resetFields();
    form.setFieldsValue({
      invoiceDate: moment(),
      dueDate: moment().add(30, "days"),
      currencyCode: "USD",
      status: "DRAFT",
    });
    setDrawerVisible(true);
  };

  const openDrawerToEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setLineItemsError("");
    console.log("Editing invoice:", invoice);
    const invoiceCustomerId = String(invoice.customerId || "");

    const customer = invoiceCustomerId
      ? customers.find(c => String(c.externalId) === invoiceCustomerId)
      : null;
    form.setFieldsValue({
      invoiceNumber: invoice.invoiceNumber || "",
      reference: invoice.reference || "",
      status: invoice.status || "",
      currencyCode: invoice.currencyCode || "",
      invoiceDate: invoice.invoiceDate ? moment(invoice.invoiceDate) : null,
      dueDate: invoice.dueDate ? moment(invoice.dueDate) : null,
      customerId: invoiceCustomerId,

      customerName: customer ? customer.displayName : (invoice.customerName || ""),
      
      addresses: [{
        line1: invoice.billingAddress || "",
        type: "Billing"
      }],
      sourceSystem: invoice.sourceSystem || ""
    });
    const mappedLineItems = invoice.lineItems?.map(item => ({
      id: item.lineId || "",
      productId: item.itemCode || "",
      description: item.description || "",
      quantity: item.quantity || 0,
      rate: item.unitAmount || 0,
      amount: item.lineAmount || 0,
      accountCode: item.accountCode || ""
    })) || [];
  
    setLineItems(mappedLineItems);
    setDrawerVisible(true);
  };

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewModalVisible(true);
  };

  const handleDeleteInvoice = async (id: string, platform: string) => {
    try {

      await invoiceService.deleteInvoice(id, platform);

      loadInvoices();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      message.error("Failed to delete invoice");
    }
  };

  const handleSubmitInvoice = async (values: any) => {
    if (!validateLineItems()) {
      return;
    }

    setSavingInvoice(true);

    try {
      const { subtotal, total } = calculateInvoiceTotal(lineItems);
      const invoiceData = {
        externalId: editingInvoice?.invoiceId,
        invoiceNumber: values.invoiceNumber,
        reference: values.reference,
        status: values.status,
        currencyCode: values.currencyCode,
        invoiceDate: values.invoiceDate.format("YYYY-MM-DD"),
        dueDate: values.dueDate.format("YYYY-MM-DD"),
        customerId: values.customerId,
        customerName: values.customerName,
        addresses: values.addresses || [{
          line1: values.billingAddress || "",
          line2: "",
          city: "",
          region: "",
          postalCode: "",
          country: "",
          type: "Billing"
        }],
        lineItems: lineItems.map(item => {
          const productId =
            values.sourceSystem === "Xero" && !editingInvoice
              ? products.find(p => p.externalId === item.productId)?.code
              : item.productId;

          return {
            productId,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            unitAmount: item.rate,
            taxAmount: 0,
            lineTotal: item.amount,
            accountCode: item.accountCode
          };
        }),
        subtotal: subtotal,
        taxAmount: 0,
        totalAmount: total,
        amountDue: total,
        amountPaid: 0,
        lineAmountTypes: "Exclusive",
        updatedAt: new Date().toISOString(),
        sourceSystem: values.sourceSystem || "QuickBooks"
      };
      console.log("Invoice Data", invoiceData);
      if (editingInvoice) {
        await invoiceService.updateInvoice(editingInvoice.invoiceId, invoiceData, values.sourceSystem);
      } else {
        await invoiceService.createInvoice(invoiceData, values.sourceSystem);
      }

      loadInvoices();
      setDrawerVisible(false);
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      if (error.response?.data?.error) {
        try {
          const errorObj = JSON.parse(error.response.data.error);
          if (errorObj?.Fault?.Error?.[0]?.Detail) {
            message.error(errorObj.Fault.Error[0].Detail);
          } else {
            message.error("An error occurred while saving the invoice");
          }
        } catch (e) {
          message.error("An error occurred while saving the invoice");
        }
      } else {
        message.error("An error occurred while saving the invoice");
      }
    } finally {
      setSavingInvoice(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      sorter: true,
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      sorter: true,
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => {
        let color = 'default';
        if (status === 'PAID') color = 'green';
        if (status === 'DRAFT') color = 'blue';
        if (status === 'OVERDUE') color = 'red';
        if (status === 'SENT') color = 'orange';

        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: "Date",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      sorter: true,
      width: 120,
      render: (date: string) => moment(date).format("MM/DD/YYYY")
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date: string) => moment(date).format("MM/DD/YYYY")
    },
    {
      title: "Amount",
      dataIndex: "total",
      key: "total",
      sorter: true,
      width: 120,
      render: (amount: number, record: Invoice) => (
        <span>
          {record.currencyCode} {amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "sourceSystem",
      key: "sourceSystem",
      width: 120,
      render: (source: string) => <Tag>{source}</Tag>
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Invoice) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openDrawerToEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this invoice?"
              description="This action cannot be undone"
              onConfirm={() => handleDeleteInvoice(record.invoiceId, record.sourceSystem)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
  const [quickbooksLoading, setQuickBooksLoading] = useState<boolean>(false);
  const [xeroLoading, setXeroLoading] = useState<boolean>(false);
  const downloadAccounts = async (platform: string) => {
    try {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(true);
      }
      else {
        setXeroLoading(true);
      }
      const response = await invoiceService.syncInvoices(platform);
      if (response.status === 200) {
        message.success(response.message);
        loadInvoices();
      } else {
        message.error("Failed to download.");
      }
    } catch (error) {
      console.error("Failed to download accounts:", error);
      message.error("Failed to download accounts.");
    } finally {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(false);
      }
      else {
        setXeroLoading(false);
      }
    }
  };
  const { connectedAccounts } = useAuth();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
          <Title level={2}>Invoices</Title>
          <Space size="middle">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openDrawerToCreate}
            >
              New Invoice
            </Button>

            {/* <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              Upload
            </Button> */}
          </Space>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Input.Search
            placeholder="Search invoices"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <Select
              style={{ width: 150 }}
              placeholder="Filter by source"
              allowClear
              onChange={handleSourceFilterChange}
              defaultValue="all"
            >
              <Option value="all">All Sources</Option>
              <Option value="QuickBooks">QuickBooks</Option>
              <Option value="Xero">Xero</Option>
            </Select>
            {
              connectedAccounts.quickbooks && (
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => downloadAccounts("QuickBooks")}
                  loading={quickbooksLoading}
                >
                  QuickBooks
                </Button>
              )}
            {connectedAccounts.xero && (
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => downloadAccounts("Xero")}
                loading={xeroLoading}

              >
                Xero
              </Button>
            )
            }
          </div>

        </div>
      </div>

      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="invoiceId"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
      />

      {/* Invoice View Modal */}
      <InvoiceViewModal
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        invoice={selectedInvoice}
        customers={customers}
        products={products}
      />

      {/* Invoice Form Drawer */}
      <InvoiceFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        form={form}
        customers={customers}
        products={products}
        lineItems={lineItems}
        onAddLineItem={handleAddLineItem}
        onRemoveLineItem={handleRemoveLineItem}
        onUpdateLineItem={handleUpdateLineItem}
        onCustomerChange={handleCustomerChange}
        onFinish={handleSubmitInvoice}
        isEditing={!!editingInvoice}
        loading={savingInvoice}
        lineItemsError={lineItemsError}
        setLineItems={setLineItems}
      />


      {/* <UploadInvoiceModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={() => {
          setUploadModalVisible(false);
          loadInvoices();
        }}
      /> */}
    </div>
  );
};

export default InvoicePage;