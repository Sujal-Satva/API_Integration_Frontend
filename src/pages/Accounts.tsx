import { Table, Typography, Input, Button, message, Select } from "antd";
import { useEffect, useState } from "react";
import { DownloadOutlined, SyncOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import { accountService } from "../services/accountService";
import { useAuth } from "../context/AuthContext";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Interfaces
interface Account {
  id: string;
  qbAccountId: string;
  name: string;
  accountType: string;
  accountSubType: string;
  currentBalance: number;
  currencyName: string;
  sourceSystem: string; // "QuickBooks" or "Xero"
}

interface SortInfo {
  field: string;
  order: SortOrder;
}

export const Accounts = () => {
  const [data, setData] = useState<Account[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [quickbooksLoading, setQuickBooksLoading] = useState<boolean>(false);
  const [xeroLoading, setXeroLoading] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<string>(""); // Filter for QuickBooks or Xero
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    field: "name",
    order: "ascend",
  });

  const fetchData = async () => {
    setLoading(true);
    

    try {
      const result = await accountService.getAllAccounts(
        page,
        pageSize,
        searchText,
        sortInfo.field,
        sortInfo.order === "descend" ? "desc" : "asc",
        true, 
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
  }, [page, pageSize, searchText, sortInfo, sourceFilter]); // Add sourceFilter to dependency array

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
      const response = await accountService.fetchAccountsFromQuickBooks(platform);
      if (response.status === 200) {
        message.success(response.message);
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
  const { connectedAccounts } = useAuth();
  const columns: ColumnsType<Account> = [
    { title: "Name", dataIndex: "name", key: "name", sorter: true },
    {
      title: "Account Type",
      dataIndex: "type",
      key: "accountType",
      sorter: true,
    },
    { title: "Classification", dataIndex: "classification", key: "classification" },
    {
      title: "Description", dataIndex: "description", key: "description", width: 200,
      render: (text) => { return  text && (text.length > 40 ? text.substring(0, 40) + "..." : text) },
    },
    {
      title: "Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      sorter: true,
    },
    { title: "Currency", dataIndex: "currency", key: "currency" },
    { title: "Source System", dataIndex: "sourceSystem", key: "sourceSystem", width: 150, },
    { title: "Last Updated", dataIndex: "lastUpdated", key: "lastUpdated", sorter: true, width: 200, render: (text) => new Date(text).toLocaleString(), },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Accounts</Title>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Search
          placeholder="Search by name/type/sub-type"
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
            style={{ width: 180, marginRight: 5 }}
          >
            <Option value="">All</Option>
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
    </div>
  );
};

