import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Drawer,
  Popconfirm,
  message,
  Checkbox,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  Vendor,
  PaginationState,
  SortState,
  VendorFormValues,
  Category,
  Product,
  Customer,
} from "../interfaces";
import {
  activateVendor,
  addVendor,
  deleteVendor,
  fetchVendors,
  syncVendors,
  updateVendor,
} from "../services/vendorService";
import VendorForm from "../components/VendorForm";
import BillForm from "../components/BillForm";
import {
  fetchCategories,
  fetchCustomers,
  fetchProducts,
} from "../services/billService";

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState<SortState>({ column: "", direction: "" });
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showActive, setShowActive] = useState<boolean>(true);
  const [selectedVendor, setSelectedVendor] = useState<string>("");

  const fetchVendorsAll = async (
    activeStatus = showActive,
    resetPage = false
  ) => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      const { column, direction } = sort;

      const response = await fetchVendors({
        page: resetPage ? 1 : current,
        pageSize,
        search,
        sortColumn: column,
        sortDirection: direction,
        pagination: true,
        active: activeStatus,
      });

      setVendors(response.data || []);
      setPagination((prev) => ({
        ...prev,
        current: resetPage ? 1 : current,
        total: response.totalRecords,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to load vendors.");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadReferenceData();
  }, []);
  useEffect(() => {
    fetchVendorsAll();
  }, [pagination.current, pagination.pageSize, sort, search]);

  const handleTableChange = (paginationInfo: any, _: any, sorter: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));
    setSort({
      column: sorter.field || "",
      direction:
        sorter.order === "ascend"
          ? "asc"
          : sorter.order === "descend"
          ? "desc"
          : "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteVendor(id);
      if (response.error === null) {
        message.success("Vendor deleted.");
        fetchVendorsAll();
      } else {
        const obj = JSON.parse(response.error || "{}");
        message.error(obj.Fault?.Error[0]?.Detail || "Failed to delete vendor");
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to delete vendor.");
      }
    }
  };

  const handleFormSubmit = async (values: VendorFormValues) => {
    setFormLoading(true);
    try {
      if (editingVendor) {
        const response = await updateVendor(editingVendor.vId, values);
        if (response.error === null) {
          message.success("Vendor updated successfully.");
          closeDrawer();
          fetchVendorsAll();
        } else {
          message.error("Failed to update vendor.");
        }
      } else {
        const response = await addVendor(values);
        if (response.error === null) {
          message.success("Vendor added successfully.");
          closeDrawer();
          fetchVendorsAll();
        } else {
          message.error("Failed to add vendor.");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Operation failed.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkActive = async (id: string) => {
    try {
      const response = await activateVendor(id);
      if (response.error === null) {
        message.success("Vendor marked as active.");
        fetchVendorsAll();
      } else {
        message.error("Failed to mark vendor as active.");
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to mark vendor as active.");
      }
    }
  };

  const handleSyncVendors = async () => {
    setSyncLoading(true);
    try {
      const response = await syncVendors();
      console.log(response);
      message.success("Vendors synced successfully!");
      fetchVendorsAll();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Failed to sync vendors.");
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const handleActiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowActive(newValue);
    fetchVendorsAll(newValue, true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingVendor(null);
  };

  const columns = [
    {
      title: "Display Name",
      dataIndex: "displayName",
      sorter: true,
    },
    {
      title: "Balance",
      dataIndex: "balance",
      sorter: true,
    },
    {
      title: "Currency",
      dataIndex: "currencyName",
    },
    {
      title: "Phone",
      dataIndex: "primaryPhone",
    },
    {
      title: "Email",
      dataIndex: "primaryEmailAddr",
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Vendor) => (
        <Space>
          {record.active === false ? (
            <Button type="primary" onClick={() => handleMarkActive(record.vId)}>
              Mark Active
            </Button>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingVendor(record);
                  setDrawerVisible(true);
                }}
              />
              <Popconfirm
                title="Delete this vendor?"
                onConfirm={() => handleDelete(record.vId)}
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
              <Button
                icon={<ShopOutlined />}
                onClick={() => {
                  showModal();
                  setSelectedVendor(record.vId);
                }}
              />
            </>
          )}
        </Space>
      ),
    },
  ];
  const loadReferenceData = async () => {
    try {
      const [categoriesData, productsData, customersData] = await Promise.all([
        // fetchVendors(),
        fetchCategories(),
        fetchProducts(),
        fetchCustomers(),
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading reference data:", error);
    }
  };
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleFormSuccess = () => {
    setModalVisible(false);
  };

  return (
    <div>
      <Space
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Input.Search
          placeholder="Search vendors..."
          onSearch={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
          allowClear
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerVisible(true)}
        >
          Add Vendor
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleSyncVendors}
          loading={syncLoading}
          block
        >
          Sync Vendors
        </Button>

        <Checkbox onChange={handleActiveToggle} checked={showActive}>
          Active Vendors
        </Checkbox>
      </Space>

      <Table
        columns={columns}
        dataSource={vendors}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30"],
        }}
        loading={loading}
        onChange={handleTableChange}
      />

      <Drawer
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
        open={drawerVisible}
        onClose={closeDrawer}
        width={600}
      >
        <VendorForm
          vendor={editingVendor || undefined}
          onFinish={handleFormSubmit}
          loading={formLoading}
        />
      </Drawer>

      <Modal
        title="Add New Bill"
        open={modalVisible}
        onCancel={handleCancel}
        width={1000}
        footer={null}
      >
        <BillForm
          selectedVendorFromVendor={selectedVendor}
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
    </div>
  );
};

export default Vendors;
