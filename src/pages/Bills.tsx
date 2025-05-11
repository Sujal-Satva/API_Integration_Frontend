import { Table, Typography, Input, Button, message, Select, Form, Tag, Modal, Descriptions } from "antd";
import { useEffect, useState } from "react";
import { EditOutlined, PlusOutlined, SyncOutlined, EyeOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import { billService,  } from "../services/billService";

import { useAuth } from "../context/AuthContext";

import BillCommonForm from "../components/BillCommonForm";


const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface InvoiceTotal {
  subtotal: number;
  total: number;
}

interface LineItem {
  // For Bill LineItems
  lineId?: string;
  lineNumber?: number | null;
  description: string;
  lineAmount?: number;
  detailType?: string;
  
  // For Invoice LineItems
  id?: string;
  productId?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  accountCode?: string;
  
  itemDetail?: {
    billableStatus: string | null;
    itemCode: string;
    description: string | null;
    itemName: string | null;
    quantity: number | null;
    unitAmount: number | null;
    taxType: string | null;
    taxAmount: number | null;
  } | null;
  accountDetail?: {
    customerId: string | null;
    customerName: string | null;
    accountCode: string;
    accountName: string | null;
    billableStatus: string | null;
    taxType: string | null;
  } | null;
}

interface Bill {
  id: number;
  externalId: string;
  sourceSystem: string;
  vendorName: string;
  vendorId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
  vendorDetails: {
    contactID: string;
    name: string;
  } | null;
}

interface SortInfo {
  field: string;
  order: SortOrder;
}

export const Bills = () => {
  const [data, setData] = useState<Bill[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [quickbooksLoading, setQuickBooksLoading] = useState<boolean>(false);
  const [xeroLoading, setXeroLoading] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [showActive, setShowActive] = useState(true);
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    field: "UpdatedAt",
    order: "descend",
  });

  // For bill details modal
  const [viewModalVisible, setViewModalVisible] = useState<boolean>(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await billService.fetchBills(
        page,
        pageSize,
        searchText,
        sortInfo.field,
        sortInfo.order === "descend" ? "desc" : "asc",
        sourceFilter,
        showActive
      );

      setData(result.data.data);
      setTotalRecords(result.data.totalRecords);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchText, sortInfo, sourceFilter, showActive]);

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, showActive]);

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, (string | number | boolean)[] | null>,
    sorter: any
  ) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);

    if (sorter.order) {
      setSortInfo({
        field: sorter.field,
        order: sorter.order,
      });
    }
  };

  const downloadBills = async (platform: string) => {
    try {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(true);
      } else {
        setXeroLoading(true);
      }
      const response = await billService.syncBillsFromQuickBooks(platform);
      if (response.status === 200) {
        message.success(response.message);
        fetchData();
      } else {
        message.error("Failed to download bills.");
      }
    } catch (error) {
      console.error("Failed to download bills:", error);
      message.error("Failed to download bills.");
    } finally {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(false);
      } else {
        setXeroLoading(false);
      }
    }
  };

  const getStatusTag = (status: string) => {
    let color = '';
    switch (status.toUpperCase()) {
      case 'AUTHORISED':
      case 'ACTIVE':
        color = 'green';
        break;
      case 'VOIDED':
      case 'ARCHIVED':
        color = 'red';
        break;
      default:
        color = 'blue';
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const viewBillDetails = (bill: Bill) => {
    setCurrentBill(bill);
    setViewModalVisible(true);
  };

  const { connectedAccounts } = useAuth();
  const columns: ColumnsType<Bill> = [
    { title: "Vendor", dataIndex: "vendorName", key: "vendorName", sorter: true, width: 180 },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      key: "issueDate",
      sorter: true,
      render: (text) => new Date(text).toLocaleDateString()
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      sorter: true,
      render: (text) => new Date(text).toLocaleDateString()
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      sorter: true,
      render: (amount, record) => `${amount} ${record.currency}`
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status)
    },
    { title: "Source", dataIndex: "sourceSystem", key: "sourceSystem", width: 120 },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => new Date(text).toLocaleString(),
      width: 180
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <Button
            type="link"
            onClick={() => viewBillDetails(record)}
            icon={<EyeOutlined />}
          />
          {/* <Button 
            type="link" 
            onClick={() => openDrawerToEdit(record)} 
            icon={<EditOutlined />} 
          /> */}
        </div>
      ),
    }
  ];

  const openDrawer = (bill?: Bill) => {

    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  
 
  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };
  return (
    <div className="p-6">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 0 }}>
        <Title level={2}>Bills</Title>
        <Button type="primary" onClick={() => openDrawer()} style={{ marginBottom: 10 }}>
          <PlusOutlined /> Add Bill
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Search
          placeholder="Search by vendor name"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setSearchText(value);
          }}
          style={{ width: 250 }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <Select
            defaultValue=""
            onChange={(value) => setSourceFilter(value)}
            style={{ width: 120 }}
          >
            <Option value="">All Sources</Option>
            <Option value="QuickBooks">QuickBooks</Option>
            <Option value="Xero">Xero</Option>
          </Select>

          {connectedAccounts.quickbooks && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => downloadBills("QuickBooks")}
              loading={quickbooksLoading}
            >
              QuickBooks
            </Button>
          )}

          {connectedAccounts.xero && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => downloadBills("Xero")}
              loading={xeroLoading}
            >
              Xero
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: totalRecords,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />

      <BillCommonForm 
        visible={drawerVisible}
        onClose={closeDrawer}
        fetchData={fetchData}
      />

      {/* <BillFormDrawer
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
      /> */}

      {/* Bill Details Modal */}
      <Modal
        title={`Bill Details - ${currentBill?.vendorName || ''}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {currentBill && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Vendor">{currentBill.vendorName}</Descriptions.Item>
              <Descriptions.Item label="Source">{currentBill.sourceSystem}</Descriptions.Item>
              <Descriptions.Item label="Issue Date">{new Date(currentBill.issueDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{new Date(currentBill.dueDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Total Amount">{formatCurrency(currentBill.totalAmount, currentBill.currency)}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(currentBill.status)}</Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ marginTop: 16 }}>Line Items</Title>
            <Table
              dataSource={currentBill.lineItems}
              rowKey="lineId"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                  width: '30%'
                },
                {
                  title: 'Type',
                  dataIndex: 'detailType',
                  key: 'detailType',
                  render: (text) => {
                    const displayText = text === 'ItemBasedExpenseLineDetail' ? 'Item' :
                      text === 'AccountBasedExpenseLineDetail' ? 'Account' : text;
                    return displayText;
                  }
                },
                {
                  title: 'Item/Account Code',
                  key: 'code',
                  render: (_, record) => {
                    if (record.itemDetail) {
                      return record.itemDetail.itemCode;
                    } else if (record.accountDetail) {
                      return record.accountDetail.accountCode;
                    }
                    return '-';
                  }
                },
                {
                  title: 'Quantity',
                  key: 'quantity',
                  render: (_, record) => {
                    return record.itemDetail?.quantity || '-';
                  }
                },
                {
                  title: 'Unit Amount',
                  key: 'unitAmount',
                  render: (_, record) => {
                    return record.itemDetail?.unitAmount || '-';
                  }
                },
                {
                  title: 'Line Amount',
                  dataIndex: 'lineAmount',
                  key: 'lineAmount',
                  render: (amount) => formatCurrency(amount, currentBill.currency)
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};