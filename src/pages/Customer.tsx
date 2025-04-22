import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Table,
  Modal,
  Drawer,
  Form,
  Input,
  Typography,
  Pagination,
  message,
  Checkbox,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchCustomers,
  saveCustomer,
  deleteCustomer,
  downloadCustomers,
  markCustomerAsActive,
} from "../services/customerService";
import debounce from "lodash/debounce";

const { Title } = Typography;

const Customer = () => {
  interface Customer {
    id: string;
    displayName: string;
    email: string;
    phone: string;
    line1: string;
    city: string;
    countrySubDivisionCode: string;
    postalCode: string;
  }

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | undefined>(
    undefined
  );
  const [visible, setVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 30,
  });
  const [sortInfo, setSortInfo] = useState({ field: "", order: "" });
  const [isActive, setIsActive] = useState(true);
  const debouncedSearch = useRef(
    debounce((term) => fetchCustomerData(term), 500)
  );

  useEffect(() => {
    fetchCustomerData();
  }, [pagination.current, pagination.pageSize, sortInfo]);

  const fetchCustomerData = async (searchTerm = "", activestatus = true) => {
    setLoading(true);
    try {
      if (!activestatus) {
        setPagination((values) => ({
          ...values,
          current: 1,
        }));
      }
      const data = await fetchCustomers(
        pagination.current,
        pagination.pageSize,
        searchTerm,
        sortInfo.field,
        sortInfo.order === "ascend" ? "asc" : "desc",
        activestatus
      );
      setCustomers(data.data);
      setPagination((prev) => ({ ...prev, total: data.totalRecords }));
    } catch (error) {
      console.log(error);
      message.error("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  const openDrawer = (customer: any) => {
    setIsEditMode(!!customer);
    setCurrentCustomer(customer || undefined);
    setVisible(true);
  };

  const closeDrawer = () => {
    setVisible(false);
    setCurrentCustomer(undefined);
  };

  const handleFormSubmit = async (values: any) => {
    setLoading(true);
    try {
      const result = await saveCustomer(values, isEditMode, currentCustomer);
      if (result.error == null) {
        message.success(isEditMode ? "Customer updated!" : "Customer added!");
        fetchCustomerData(searchTerm);
        closeDrawer();
      } else {
        message.error("Duplicate Name Exists Error");
      }
    } catch (error) {
      console.log(error);
      message.error("Error while saving customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    Modal.confirm({
      title: "Are you sure?",
      content: "This will deactivate the customer in QuickBooks.",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        setLoading(true);
        try {
          const data = await deleteCustomer(id);
          if (data.error == null) {
            message.success("Customer deactivated!");
            fetchCustomerData(searchTerm);
          } else {
            message.error(data.message || "Failed to deactivate customer.");
          }
        } catch (error) {
          console.log(error);
          message.error("Error while deactivating customer.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSearchChange = (e: any) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch.current(value);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadCustomers();
      message.success("Customers downloaded successfully!");
    } catch (error) {
      console.log(error);
      message.error("Failed to download customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsActive = async (id: string) => {
    try {
      await markCustomerAsActive(id);
      message.success("Customer marked as active.");
      fetchCustomerData();
    } catch (error) {
      console.log(error);
      message.error("Failed to mark customer as active.");
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortInfo({
      field: sorter.field || "",
      order: sorter.order || "",
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "displayName",
      key: "displayName",
      sorter: true,
      sortOrder: sortInfo.field === "displayName" ? sortInfo.order : null,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
      sortOrder: sortInfo.field === "email" ? sortInfo.order : null,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: true,
      sortOrder: sortInfo.field === "phone" ? sortInfo.order : null,
    },
    {
      title: "Address",
      key: "address",
      render: (_: any, record: Customer) => {
        const parts = [
          record.line1,
          record.city,
          record.countrySubDivisionCode,
          record.postalCode,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => (
        <>
          {isActive ? (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => openDrawer(record)}
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                danger
                style={{ marginLeft: 8 }}
              />
            </>
          ) : (
            <Button
              type="primary"
              onClick={() => handleMarkAsActive(record.qbId)}
            >
              Mark as Active
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Customer</Title>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Input
          placeholder="Search Customers"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ width: 250 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openDrawer(null)}
        >
          Add Customer
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          Sync Customers
        </Button>
        <Checkbox
          checked={isActive}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsActive(checked);
            fetchCustomerData("", checked);
          }}
        >
          Active Customers
        </Checkbox>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={false}
        onChange={handleTableChange}
        rowKey="id"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
          marginBottom: 16,
        }}
      >
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger
          pageSizeOptions={["5", "10", "20", "50"]}
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
          style={{ marginTop: 16 }}
        />
      </div>

      <Drawer
        title={isEditMode ? "Edit Customer" : "Add Customer"}
        visible={visible}
        onClose={closeDrawer}
        width={600}
        destroyOnClose
      >
        <Form
          initialValues={currentCustomer}
          onFinish={handleFormSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Display Name"
            name="displayName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Line 1" name="line1" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="City" name="city" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="State/Province (CA)"
            name="countrySubDivisionCode"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Postal Code"
            name="postalCode"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? "Update Customer" : "Add Customer"}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Customer;
