import { Table, Typography, Input, Button, message, Select, Form, Popconfirm, Switch } from "antd";
import { useEffect, useState } from "react";
import { EditOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import { vendorService } from "../services/vendorService";
import { useAuth } from "../context/AuthContext";
import { VendorDrawer } from "../components/VendorDrawer";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Vendor {
  id: number;
  externalId: string;
  sourceSystem: string;
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  active: boolean;
  balance: number;
  vendor1099: boolean;
  createTime: string;
  lastUpdatedTime: string;
}

interface SortInfo {
  field: string;
  order: SortOrder;
}

export const Vendor = () => {
  const [data, setData] = useState<Vendor[]>([]);
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
    field: "displayName",
    order: "ascend",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await vendorService.getAllVendors(
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
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchText, sortInfo, sourceFilter, showActive]);

  useEffect(() => {
    setPage(1);
    setPageSize(10);
    setSortInfo({ field: "displayName", order: "ascend" });
    setSearchText("");
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

  const downloadVendors = async (platform: string) => {
    try {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(true);
      }
      else {
        setXeroLoading(true);
      }
      const response = await vendorService.fetchVendors(platform);
      if (response.status === 200) {
        message.success(response.message);
        fetchData();
      } else {
        message.error("Failed to download vendors.");
      }
    } catch (error) {
      console.error("Failed to download vendors:", error);
      message.error("Failed to download vendors.");
    } finally {
      if (platform === "QuickBooks") {
        setQuickBooksLoading(false);
      }
      else {
        setXeroLoading(false);
      }
    }
  };

  const toggleVendorActiveStatus = async (record: Vendor, isActive: boolean, platform: string) => {
    try {
      if (platform === "Xero" && isActive) {
        message.error("Xero does not support activating vendors once archived.");
        return;
      }
      const status = platform === "QuickBooks" ? isActive.toString() : isActive ? "ACTIVE" : "ARCHIVED";
      await vendorService.updateVendorStatus(
        record.externalId,
        platform,
        status
      );

      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const { connectedAccounts } = useAuth();
  const columns: ColumnsType<Vendor> = [
    { title: "Name", dataIndex: "displayName", key: "displayName", sorter: true, width: 200 },
    { title: "Company", dataIndex: "companyName", key: "companyName", sorter: true },
    { title: "Email", dataIndex: "email", key: "email", sorter: true },
    { title: "Phone", dataIndex: "phone", key: "phone", sorter: true },
    
    { title: "Balance", dataIndex: "balance", key: "balance", sorter: true, render: (val) => `$${val.toFixed(2)}` },
   
    { title: "Source System", dataIndex: "sourceSystem", key: "sourceSystem", width: 140 },
    { 
      title: "Last Updated", 
      dataIndex: "lastUpdatedTime", 
      key: "lastUpdatedTime", 
      sorter: true, 
      render: (text) => new Date(text).toLocaleString(),
      width: 200 
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (text, record) => (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {record.active ? (
            <>
              <Button type="link" onClick={() => openDrawer(record)} icon={<EditOutlined />} />
              <Popconfirm
                title={`Are you sure you want to ${record.active ? 'deactivate' : 'activate'} this vendor?`}
                onConfirm={() => toggleVendorActiveStatus(record, !record.active, record.sourceSystem)}
                okText="Yes"
                cancelText="No"
              >
                <Switch
                  checked={record.active}
                  size="small"
                />
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              title={`Are you sure you want to ${record.active ? 'deactivate' : 'activate'} this vendor?`}
              onConfirm={() => toggleVendorActiveStatus(record, !record.active, record.sourceSystem)}
              okText="Yes"
              cancelText="No"
            >
              <Switch
                checked={record.active}
                size="small"
                loading={loading}
              />
            </Popconfirm>
          )}
        </div>
      ),
    }
  ];

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();
  const [drawerLoading, setDrawerLoading] = useState(false);

  const openDrawer = (vendor?: Vendor) => {
    setEditingVendor(vendor ? { ...vendor } : null);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const handleDrawerSubmit = async (values: any, platform: string) => {
    try {
      setDrawerLoading(true);
      if (editingVendor) {
        await vendorService.editVendor(values, editingVendor.externalId, platform);
      } else {
        await vendorService.addVendor(values, platform);
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
        <Title level={2}>Vendors</Title>
        <Button type="primary" onClick={() => openDrawer()} style={{ marginBottom: 10 }}>
          <PlusOutlined /> Add Vendor
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Search
          placeholder="Search vendors"
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
            style={{ width: 100 }}
          >
            <Option value="">All</Option>
            <Option value="QuickBooks">QuickBooks</Option>
            <Option value="Xero">Xero</Option>
          </Select>

          {connectedAccounts.quickbooks && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => downloadVendors("QuickBooks")}
              loading={quickbooksLoading}
            >
              QuickBooks
            </Button>
          )}
          
          
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch checked={showActive} onChange={setShowActive} />
            <span>Show Active</span>
          </div>
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

      <VendorDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        vendor={editingVendor}
        form={form}
        loading={drawerLoading}
      />
    </div>
  );
};