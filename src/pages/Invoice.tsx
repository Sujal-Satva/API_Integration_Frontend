import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Input,
  Button,
  Form,
  message,
  Upload,
  Modal,
  Table,
} from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import InvoiceTable from "./../components/InvoiceTable";
import InvoiceViewModal from "./../components/InvoiceViewModal";
import InvoiceFormDrawer from "./../components/InvoiceFormDrawer";
import {
  fetchCustomers,
  fetchProducts,
  fetchInvoices as fetchInvoicesApi,
  createInvoice,
  updateInvoice,
  deleteInvoice as deleteInvoiceApi,
  syncInvoices,
} from "./../services/invoiceService";
import Papa from "papaparse";
import {
  Invoice as InvoiceType,
  Customer,
  Product,
  LineItem,
  PaginationParams,
  SorterParams,
  InvoiceFormValues,
  InvoiceRow,
  CSVError,
} from "./../interfaces";

const calculateTotal = (items: LineItem[]) => {
  const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
  return { subtotal, total: subtotal };
};

export const Invoice: React.FC = () => {
  const [form] = Form.useForm();
  const [invoiceData, setInvoiceData] = useState<InvoiceType[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineItemsError, setLineItemsError] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(
    null
  );
  const [editingInvoice, setEditingInvoice] = useState<InvoiceType | null>(
    null
  );
  const [pagination, setPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: ["10", "20", "30"],
    showSizeChanger: true,
  });
  const [sorter, setSorter] = useState<SorterParams>({
    field: "createdAt",
    order: "descend",
  });
  const [searchText, setSearchText] = useState("");
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data.filter((item: Customer) => item.isActive === true));
    } catch (error) {
      console.log(error);
      message.error("Failed to fetch customers");
    }
  };

  const loadInvoices = async (
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDirection = "desc",
    search = ""
  ) => {
    setLoading(true);
    try {
      const data = await fetchInvoicesApi(
        page,
        pageSize,
        sortBy,
        sortDirection,
        search
      );
      setInvoiceData(data.data);
      setPagination({
        ...pagination,
        current: data.page,
        pageSize: data.pageSize,
        total: data.totalRecords,
      });
    } catch (error) {
      message.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.filter((item: Product) => item.active === true));
    } catch (error) {
      console.log(error);
      message.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadInvoices();
  }, []);

  const handleCustomerChange = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      form.setFieldsValue({
        billingAddress: customer.line1,
        customerEmail: customer.email,
      });
    }
  };

  const handleAddLineItem = () => {
    const newLineItem: LineItem = {
      id: Date.now(),
      productId: undefined,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setLineItems([...lineItems, newLineItem]);
    setLineItemsError("");
  };

  const handleTableChange = (
    paginationInfo: any,
    _filters: any,
    sorterInfo: any
  ) => {
    const sortField = sorterInfo.field || "createdAt";
    const sortOrder = sorterInfo.order === "ascend" ? "asc" : "desc";

    setSorter({
      field: sortField,
      order: sorterInfo.order || "descend",
    });

    setPagination({
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });

    loadInvoices(
      paginationInfo.current,
      paginationInfo.pageSize,
      sortField,
      sortOrder,
      searchText
    );
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const openDrawerToCreate = () => {
    setEditingInvoice(null);
    setLineItems([]);
    setLineItemsError("");
    form.resetFields();
    form.setFieldsValue({
      invoiceDate: moment(),
      dueDate: moment().add(30, "days"),
    });
    setDrawerVisible(true);
  };

  const openDrawerToEdit = (record: InvoiceType) => {
    setEditingInvoice(record);
    setLineItemsError("");
    form.setFieldsValue({
      customer: record.customerId,
      customerEmail: customers.find((ele) => ele.id === record.customerId)
        ?.email,
      invoiceDate: record.invoiceDate ? moment(record.invoiceDate) : null,
      dueDate: record.dueDate ? moment(record.dueDate) : null,
      store: record.store,
      billingAddress: record.billingAddress,
    });
    setLineItems(record.lineItems || []);
    setDrawerVisible(true);
  };

  const openViewModal = (record: InvoiceType) => {
    setSelectedInvoice(record);
    setViewModalVisible(true);
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      const response = await deleteInvoiceApi(id);
      if (response.error == null) {
        message.success("Invoice deleted successfully");
        loadInvoices();
      } else {
        const errorMsg = JSON.parse(response.error);
        message.error(errorMsg.Message);
      }
    } catch (error) {
      message.error("Failed to delete invoice");
    }
  };

  const validateLineItems = (): boolean => {
    if (lineItems.length === 0) {
      message.error("Please add at least one item to the invoice");
      return false;
    }

    const invalidItems = lineItems.filter(
      (item) => !item.productId || item.quantity <= 0
    );

    if (invalidItems.length > 0) {
      message.error(
        "All line items must have a selected product and valid quantity"
      );
      return false;
    }

    setLineItemsError("");
    return true;
  };

  const onFinish = async (values: InvoiceFormValues) => {
    if (!validateLineItems()) {
      return;
    }

    const { subtotal, total } = calculateTotal(lineItems);
    const invoicePayload = {
      customerId: values.customer,
      customerEmail: values.customerEmail,
      invoiceDate: values.invoiceDate
        ? values.invoiceDate.format("YYYY-MM-DD")
        : new Date().toISOString().split("T")[0],
      dueDate: values.dueDate
        ? values.dueDate.format("YYYY-MM-DD")
        : new Date().toISOString().split("T")[0],
      store: values.store,
      billingAddress: values.billingAddress,
      subtotal: subtotal,
      total: total,
      sendLater: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineItems: lineItems.map((item) => ({
        productId: products.find((p) => p.qbItemId == item.productId)?.qbItemId,
        description: item.description,
        quantity: item.quantity,
        amount: item.amount,
        rate: item.rate,
      })),
    };
    setSaving(true);

    try {
      if (editingInvoice) {
        const response = await updateInvoice(
          editingInvoice.invoiceId,
          invoicePayload
        );
        if (response.error == null) {
          message.success("Invoice updated successfully");
        }
      } else {
        const response = await createInvoice(invoicePayload);
        if (response.error == null) {
          message.success("Invoice created successfully");
        }
      }
      loadInvoices();
      setDrawerVisible(false);
    } catch (err: any) {
      const obj = JSON.parse(err.response.data.error);
      if (obj?.Fault?.Error?.[0]?.Detail) {
        message.error(obj.Fault.Error[0].Detail);
      } else {
        message.error(
          "An unexpected error occurred while processing the request."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadInvoices(
      1,
      pagination.pageSize,
      sorter.field,
      sorter.order === "ascend" ? "asc" : "desc",
      searchText
    );
  };

  const handleSyncInvoices = async () => {
    try {
      setInvoiceLoading(true);
      await syncInvoices();
      message.success("Invoices downloaded successfully!");
      loadInvoices();
    } catch (error) {
      console.log(error);
      message.error("Failed to download invoices.");
    } finally {
      setInvoiceLoading(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const handleCSVUpload = (file: File) => {
    Papa.parse<InvoiceRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        const validationErrors = validateCSVRows(data);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setIsModalVisible(true);
        } else {
          setErrors([]);
          setIsModalVisible(false);
          message.loading("File Uploading...");

          const formData = new FormData();
          formData.append("file", file);

          try {
            const token = localStorage.getItem("qb_access_token");
            const realmId = localStorage.getItem("qb_realm_id");
            const response = await fetch(
              `${API_URL}/api/Invoice/upload-csv?realmId=${realmId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`, 
                },
                body: formData,
              }
            );

            const result = await response.json();

            if (response.ok) {
              message.success("CSV uploaded and processed successfully!");
              console.log("Server response:", result);
            } else {
              message.error("CSV upload failed.");
              console.error("Server error:", result);
            }
          } catch (error) {
            console.error("Upload failed:", error);
            message.error("Failed to upload CSV file.");
          }
        }
      },

      error: (err) => {
        message.info("CSV Parse Error");
        console.error("CSV Parse Error:", err);
      },
    });

    return false;
  };

  const [errors, setErrors] = useState<CSVError[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const validateCSVRows = (rows: InvoiceRow[]): CSVError[] => {
    const invoiceSet = new Set();
    const errors: CSVError[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row.InvoiceNumber) {
        errors.push({ row: rowNum, message: "InvoiceNumber is required." });
      } else if (invoiceSet.has(row.InvoiceNumber)) {
        errors.push({ row: rowNum, message: "Duplicate Invoice Number." });
      } else {
        invoiceSet.add(row.InvoiceNumber);
      }

      if (!row.CustomerName) {
        errors.push({ row: rowNum, message: "CustomerName is required." });
      }

      if (
        row.CustomerEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.CustomerEmail)
      ) {
        errors.push({ row: rowNum, message: "Invalid email format." });
      }

      if (isNaN(Date.parse(row.InvoiceDate))) {
        errors.push({ row: rowNum, message: "Invalid InvoiceDate." });
      }

      if (isNaN(Date.parse(row.DueDate))) {
        errors.push({ row: rowNum, message: "Invalid DueDate." });
      }

      if (!row.ItemName) {
        errors.push({ row: rowNum, message: "ItemName is required." });
      }

      if (!row.ItemDescription) {
        errors.push({ row: rowNum, message: "ItemDescription is required." });
      }

      if (
        !row.Quantity ||
        isNaN(Number(row.Quantity)) ||
        Number(row.Quantity) <= 0
      ) {
        errors.push({
          row: rowNum,
          message: "Quantity must be a positive number.",
        });
      }

      if (!row.Rate || isNaN(Number(row.Rate)) || Number(row.Rate) < 0) {
        errors.push({
          row: rowNum,
          message: "Rate must be a non-negative number.",
        });
      }
    });

    return errors;
  };

  const columns = [
    { title: "Row", dataIndex: "row", key: "row" },
    { title: "Error Message", dataIndex: "message", key: "message" },
  ];

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography.Title level={4}>Invoice Management</Typography.Title>
        <div>
          <Input.Search
            placeholder="Search invoices"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginRight: 8 }}
          />
          <Button type="primary" onClick={openDrawerToCreate}>
            + Add Invoice
          </Button>

          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            icon={<DownloadOutlined />}
            onClick={handleSyncInvoices}
            loading={invoiceLoading}
          >
            Sync Invoices
          </Button>

          <Upload
            accept=".csv"
            beforeUpload={handleCSVUpload}
            showUploadList={false}
          >
            <Button
              icon={<UploadOutlined />}
              type="primary"
              style={{ marginLeft: 8 }}
            >
              Upload CSV File
            </Button>
          </Upload>

          <Modal
            title="CSV Validation Errors"
            open={isModalVisible}
            onOk={() => setIsModalVisible(false)}
            onCancel={() => setIsModalVisible(false)}
            width={600}
          >
            <Table
              columns={columns}
              dataSource={errors}
              rowKey={(record, index) => index.toString()}
              pagination={false}
              size="small"
            />
          </Modal>
          <input
            type="file"
            accept=".csv" // Allow only .csv files
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCSVUpload(file);
            }}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <InvoiceTable
        invoiceData={invoiceData}
        customers={customers}
        loading={loading}
        pagination={pagination}
        handleTableChange={handleTableChange}
        openViewModal={openViewModal}
        openDrawerToEdit={openDrawerToEdit}
        handleDeleteInvoice={handleDeleteInvoice}
      />

      <InvoiceViewModal
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        selectedInvoice={selectedInvoice}
        customers={customers}
        products={products}
      />

      <InvoiceFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        customers={customers}
        products={products}
        form={form}
        lineItems={lineItems}
        setLineItems={setLineItems}
        handleCustomerChange={handleCustomerChange}
        handleAddLineItem={handleAddLineItem}
        handleRemoveLineItem={handleRemoveLineItem}
        onFinish={onFinish}
        editingInvoice={editingInvoice}
        saving={saving}
        lineItemsError={lineItemsError}
      />
    </>
  );
};
