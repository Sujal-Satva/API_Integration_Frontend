import { Table, Typography, Input, Button, message, Select, Form, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import { customerService } from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import { CustomerDrawer } from "../components/CustomerDrawer";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
interface Account {
  id: string;
  xeroId:string;
  quickBooksId:string;
  name: string;
  accountType: string;
  accountSubType: string;
  currentBalance: number;
  currencyName: string;
  sourceSystem: string;
}

interface SortInfo {
  field: string;
  order: SortOrder;
}

export const Customer = () => {
  const [data, setData] = useState<Account[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [quickbooksLoading, setQuickBooksLoading] = useState<boolean>(false);
  const [xeroLoading, setXeroLoading] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    field: "name",
    order: "ascend",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await customerService.getAllCustomer(
        page,
        pageSize,
        searchText,
        sortInfo.field,
        sortInfo.order === "descend" ? "desc" : "asc",
        sourceFilter
      );

      setData(result.data.data);
      setTotalRecords(result.data.totalRecords);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchText, sortInfo, sourceFilter]);
  
  useEffect(() => {
    setPage(1);
    setPageSize(10);
    setSortInfo({ field: "name", order: "ascend" });
    setSearchText("");
  }, [sourceFilter]);
  

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

  const downloadAccounts = async (platform: string) => {
    try {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(true);
      }
      else {
        setXeroLoading(true);
      }
      const response = await customerService.fetchCustomer(platform);
      if (response.status === 200) {
        fetchData();
      } else {
        message.error("Failed to download accounts.");
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

  const handleDelete = async (id: string, platform: string) => {
    try {
      await customerService.deleteCustomer(id, platform);
      fetchData();
    } catch (error) {
      message.error("Failed to delete customer.");
      console.error("Delete error:", error);
    }
  };

  const { connectedAccounts } = useAuth();
  const columns: ColumnsType<Account> = [
    { title: "Name", dataIndex: "displayName", key: "name", sorter: true,width: 200, },
    { title: "Email", dataIndex: "emailAddress", key: "email", sorter: true },
    {
      title: "Address", dataIndex: "addressLine1", key: "addressLine1"
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      sorter: true,
    },
    {
      title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber", sorter: true
    },
    { title: "Source System", dataIndex: "sourceSystem", key: "sourceSystem" ,width: 150, },
    { title: "Last Updated", dataIndex: "lastUpdatedUtc", key: "lastUpdated", sorter: true,render: (text) => new Date(text).toLocaleString(), width: 240, },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <div style={{ display: "flex", gap: 5 }}>
          <Button type="link" onClick={() => { openDrawer(record); }}>
            <EditOutlined />
          </Button>
          <Popconfirm
            title="Are you sure to delete this customer?"
            onConfirm={() => handleDelete(record.sourceSystem == "QuickBooks" ? record.quickBooksId : record.xeroId, record.sourceSystem)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    }

  ];

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [drawerLoading, setDrawerLoading] = useState(false);
  const openDrawer = (customer?: any) => {

    setEditingCustomer(customer ? { ...customer } : null);
    setDrawerVisible(true);
  };
  const closeDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
  };
  const handleDrawerSubmit = async (values: any, platform: string) => {
    try {
      setDrawerLoading(true);
      console.log(values, platform);
      if (editingCustomer) {
        await customerService.editCustomer(values, platform);
      } else {
        await customerService.addCustomer(values, platform);
      }
      fetchData();
      closeDrawer();
    } catch (error) {
      message.error("Operation failed.");
    } finally {
      setDrawerLoading(false);
    }
  };
  return (
    <div className="p-6">

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 0 }}>
        <Title level={2}>Customers</Title>
        <Button type="primary" onClick={() => openDrawer()} style={{ marginBottom: 10 }}>
          Add Customer </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Search
          placeholder="Search value"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setSearchText(value);
          }}
          style={{ width: 300 }}
        />

        <div>
          <Select
            defaultValue=""
            onChange={(value) => setSourceFilter(value)}
            style={{ width: 180, marginRight: 8 }}
          >
            <Option value="">All</Option>
            <Option value="QuickBooks">QuickBooks</Option>
            <Option value="Xero">Xero</Option>
          </Select>

          {
            connectedAccounts.quickbooks && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => downloadAccounts("QuickBooks")}
                loading={quickbooksLoading}
                style={{ marginLeft: 16 }}
              >
                Sync from QuickBooks
              </Button>
            )}
          {connectedAccounts.xero && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadAccounts("Xero")}
              loading={xeroLoading}
              style={{ marginLeft: 16 }}
            >
              Sync from Xero
            </Button>
          )
          }

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

      <CustomerDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        customer={editingCustomer}
        form={form}
        loading={drawerLoading}
      />

    </div>
  );
};

