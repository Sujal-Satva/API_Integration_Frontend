// Bills.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Space,
  Typography,
  Card,
  Button,
  Modal,
  message,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Bill,
  PaginationConfig,
  Vendor,
  Category,
  Product,
  Customer,
  BillLine,
} from "../interfaces";
import { formatCurrency, formatDate } from "../utils";
import {
  fetchBills,
  fetchVendors,
  fetchCategories,
  fetchProducts,
  fetchCustomers,
  syncBillsFromQuickBooks,
} from "../services/billService";
import BillForm from "./../components/BillForm";
import Search from "antd/es/input/Search";

const { Title } = Typography;

export const Bills: React.FC = () => {
  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<string>("txnDate");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [billLoading, setBillLoading] = useState<boolean>(false);

  // Reference data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Initial data load
  useEffect(() => {
    loadBills();
    loadReferenceData();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    const result = await fetchBills(
      pagination.current,
      pagination.pageSize,
      searchText,
      sortField,
      sortOrder
    );

    if (result) {
      setBills(result.bills);
      setPagination(result.pagination);
    }
    setLoading(false);
  };

  const loadReferenceData = async () => {
    try {
      const [vendorsData, categoriesData, productsData, customersData] =
        await Promise.all([
          fetchVendors(),
          fetchCategories(),
          fetchProducts(),
          fetchCustomers(),
        ]);

      setVendors(vendorsData);
      setCategories(categoriesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading reference data:", error);
    }
  };

  const handleTableChange = (paginationConfig: any, _: any, sorter: any) => {
    const { field, order } = sorter;
    const sortDirection = order === "descend" ? "desc" : "asc";
    const sortColumn = field || "txnDate";

    setSortField(sortColumn);
    setSortOrder(sortDirection);
    setLoading(true);
    fetchBills(
      paginationConfig.current,
      paginationConfig.pageSize,
      searchText,
      sortColumn,
      sortDirection
    ).then((result) => {
      if (result) {
        setBills(result.bills);
        setPagination(result.pagination);
        setLoading(false);
      }
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
    setLoading(true);
    fetchBills(1, pagination.pageSize, searchText, sortField, sortOrder).then(
      (result) => {
        if (result) {
          setBills(result.bills);
          setPagination(result.pagination);
          setLoading(false);
        }
      }
    );
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleFormSuccess = () => {
    setModalVisible(false);
    loadBills();
  };

  const downloadBills = async () => {
    setBillLoading(true);
    const success = await syncBillsFromQuickBooks();
    if (success) {
      loadBills();
    }
    setBillLoading(false);
  };

  // Table columns
  const columns = [
    {
      title: "Bill #",
      dataIndex: "quickBooksBillId",
      key: "quickBooksBillId",
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "Transaction Date",
      dataIndex: "txnDate",
      key: "txnDate",
      sorter: true,
      sortDirections: ["ascend", "descend"],
      render: (text: string) => formatDate(text),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      sorter: true,
      sortDirections: ["ascend", "descend"],
      render: (text: string) => formatDate(text),
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      key: "vendorName",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmt",
      key: "totalAmt",
      sorter: true,
      sortDirections: ["ascend", "descend"],
      render: (text: number) => formatCurrency(text),
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      sorter: true,
      sortDirections: ["ascend", "descend"],
      render: (text: number) => formatCurrency(text),
    },
    {
      title: "Notes",
      dataIndex: "privateNote",
      key: "privateNote",
      render: (text: string) => {
        return text ? <span>{text}</span> : "-";
      },
    },
    {
      title: "Account",
      dataIndex: "apAccountName",
      key: "apAccountName",
      render: (text: string) => text || "N/A",
    },
  ];

  const billLineColumns = [
    { title: "Line #", dataIndex: "lineNum", key: "lineNum" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text: number) => formatCurrency(text),
    },
    { title: "Detail Type", dataIndex: "detailType", key: "detailType" },
    { title: "Account", dataIndex: "accountName", key: "accountName" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    { title: "Product", dataIndex: "productName", key: "productName" },
    {
      title: "Billable Status",
      dataIndex: "billableStatus",
      key: "billableStatus",
    },
    { title: "Quantity", dataIndex: "qty", key: "qty" },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (text: number) => formatCurrency(text),
    },
  ];

  const SearchComponent = () => (
    <Space
      style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}
    >
      <Search
        placeholder="Search invoices"
        allowClear
        onSearch={handleSearch}
        onChange={(e) => {
          setSearchText(e.target.value);
          console.log(e.target.value);
        }}
        style={{ width: 250, marginRight: 8 }}
      />
      <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
        Add Bill
      </Button>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={downloadBills}
        loading={billLoading}
      >
        Sync Bills
      </Button>
    </Space>
  );

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>
          <DollarOutlined /> Bills
        </Title>
        <SearchComponent />
        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender: (record: Bill) => (
              <Card
                title="Bill Lines"
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Table
                  columns={billLineColumns}
                  dataSource={record.billLines}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          }}
        />
      </Space>

      <Modal
        title="Add New Bill"
        open={modalVisible}
        onCancel={handleCancel}
        width={1000}
        footer={null}
      >
        <BillForm
          vendors={vendors}
          categories={categories}
          products={products}
          customers={customers}
          onCancel={handleCancel}
          onSuccess={handleFormSuccess}
          loading={loading}
          setLoading={setLoading}
        />
      </Modal>
    </Card>
  );
};

export default Bills;
