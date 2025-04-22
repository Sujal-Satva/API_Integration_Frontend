// src/pages/Accounts.tsx
import { Table, Typography, Input, Button, message } from "antd";
import { useEffect, useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface"; // ✅ Correct import
import { accountService } from "../services/accountService";

const { Title } = Typography;
const { Search } = Input;

// Interfaces
interface Account {
  id: string;
  qbAccountId: string;
  name: string;
  accountType: string;
  accountSubType: string;
  currentBalance: number;
  currencyName: string;
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
  const [accountLoading, setAccountLoading] = useState<boolean>(false);
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    field: "Name",
    order: "ascend",
  });

  const fetchData = async () => {
    setLoading(true);
    const realmId = localStorage.getItem("qb_realm_id");

    try {
      const result = await accountService.getAllAccounts(
        realmId,
        page,
        pageSize,
        searchText,
        sortInfo.field,
        sortInfo.order === "descend" ? "desc" : "asc"
      );
      setData(result.data);
      setTotalRecords(result.totalRecords);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchText, sortInfo]);

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

  const downloadAccounts = async () => {
    const token = localStorage.getItem("qb_access_token");
    const realmId = localStorage.getItem("qb_realm_id");

    if (!token || !realmId) {
      message.error("Missing QuickBooks access token or realm ID.");
      return;
    }

    try {
      setAccountLoading(true);
      await accountService.fetchAccountsFromQuickBooks(token, realmId);
      message.success("Accounts downloaded successfully!");
    } catch (error) {
      console.error("Failed to download accounts:", error);
      message.error("Failed to download accounts.");
    } finally {
      setAccountLoading(false);
    }
  };

  const columns: ColumnsType<Account> = [
    { title: "QB ID", dataIndex: "qbAccountId", key: "qbAccountId" },
    { title: "Name", dataIndex: "name", key: "name", sorter: true },
    {
      title: "Account Type",
      dataIndex: "accountType",
      key: "accountType",
      sorter: true,
    },
    { title: "Sub Type", dataIndex: "accountSubType", key: "accountSubType" },
    {
      title: "Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      sorter: true,
    },
    { title: "Currency", dataIndex: "currencyName", key: "currencyName" },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Accounts</Title>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Search
          placeholder="Search by name/type/sub-type"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setSearchText(value);
          }}
          style={{ width: 300, marginBottom: 16 }}
        />

        <Button
          type="primary"
          style={{ marginLeft: 16 }}
          icon={<DownloadOutlined />}
          onClick={downloadAccounts}
          loading={accountLoading}
        >
          Sync Accounts
        </Button>
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
