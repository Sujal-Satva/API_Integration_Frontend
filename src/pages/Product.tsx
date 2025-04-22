import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Pagination,
  message,
  Form,
  Drawer,
  Typography,
  Row,
  Col,
  Popconfirm,
  Input,
  Checkbox,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Product, PaginationState, AccountOption } from "../interfaces";
import {
  createProduct,
  deleteProduct,
  getAccounts,
  syncProducts,
  updateProduct,
  getProducts,
  markProductAsActive,
} from "../services/productService";
import ProductForm from "../components/ProductForm";

const { Title } = Typography;
const { Search } = Input;

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [incomeAccounts, setIncomeAccounts] = useState<AccountOption[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<AccountOption[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts({
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortColumn: "name",
      sortDirection: "asc",
      search: searchText,
      active: isActive,
    });
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accounts = await getAccounts();
      setIncomeAccounts(accounts.incomeAccounts);
      setExpenseAccounts(accounts.expenseAccounts);
    } catch (error) {
      console.error("Failed to preload accounts:", error);
    }
  };

  interface FetchProductParams {
    page?: number;
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: string;
    search?: string;
    active?: boolean;
  }

  const fetchProducts = async ({
    page = 1,
    pageSize = 10,
    sortColumn = "name",
    sortDirection = "asc",
    search = "",
    active = true,
  }: FetchProductParams): Promise<void> => {
    setLoading(true);
    try {
      const response = await getProducts(
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search,
        active
      );

      setProducts(response.data);
      setPagination({
        current: response.page,
        pageSize: response.pageSize,
        total: response.totalRecords,
        totalPages: response.totalPages,
      });
    } catch (error) {
      message.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize?: number): void => {
    fetchProducts({
      page,
      pageSize: pageSize || pagination.pageSize,
      sortColumn: "name",
      sortDirection: "asc",
      search: searchText,
      active: isActive,
    });
  };

  const handleSortChange = (_: any, __: any, sorter: any): void => {
    const { columnKey, order } = sorter;
    const sortDirection = order === "ascend" ? "asc" : "desc";
    fetchProducts({
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortColumn: columnKey || "name",
      sortDirection,
      search: searchText,
      active: isActive,
    });
  };

  const handleSearch = (value: string): void => {
    setSearchText(value);
    fetchProducts({
      page: 1,
      pageSize: pagination.pageSize,
      sortColumn: "name",
      sortDirection: "asc",
      search: value,
      active: isActive,
    });
  };

  const openDrawer = (product: Product | null = null): void => {
    setIsEditMode(!!product);
    setCurrentProduct(product);
    setVisible(true);
    form.resetFields();

    if (product) {
      form.setFieldsValue({
        ...product,
        incomeAccountName: product.incomeAccountName,
        expenseAccountName: product.expenseAccountName,
      });
    }
  };

  const closeDrawer = (): void => {
    setVisible(false);
    setCurrentProduct(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any): Promise<void> => {
    setLoading(true);
    try {
      const selectedIncomeAccount = incomeAccounts.find(
        (acc) => acc.name === values.incomeAccountName
      );
      if (!selectedIncomeAccount) {
        throw new Error("Invalid income account selected");
      }

      const payload: Partial<Product> = {
        name: values.name,
        type: values.type,
        fullyQualifiedName: values.name,
        unitPrice: values.unitPrice,
        taxable: values.taxable || false,
        description: values.description || "",
        incomeAccountValue: selectedIncomeAccount?.id || "",
        incomeAccountName: selectedIncomeAccount?.name || "",
      };

      if (values.type === "Inventory") {
        const selectedExpenseAccount = expenseAccounts.find(
          (acc) => acc.name === values.expenseAccountName
        );
        if (!selectedExpenseAccount) {
          throw new Error(
            "Invalid expense account selected for inventory item"
          );
        }
        payload.expenseAccountValue = selectedExpenseAccount?.id || "";
        payload.expenseAccountName = selectedExpenseAccount?.name || "";
      }

      if (isEditMode && currentProduct) {
        await updateProduct(currentProduct.id.toString(), payload);
        message.success("Product updated!");
      } else {
        await createProduct(payload);
        message.success("Product added!");
      }

      fetchProducts({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortColumn: "name",
        sortDirection: "asc",
        search: searchText,
        active: isActive,
      });
      closeDrawer();
    } catch (error: any) {
      message.error(error.message || "Error while saving product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await deleteProduct(id);
      message.success("Product deleted successfully!");
      fetchProducts({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortColumn: "name",
        sortDirection: "asc",
        search: searchText,
        active: isActive,
      });
    } catch (error: any) {
      message.error(
        error.message || "An error occurred while deleting the product."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsActive = async (id: string) => {
    try {
      await markProductAsActive(id);
      message.success("Product marked as active.");
      fetchProducts({});
    } catch (error) {
      console.log(error);
      message.error("Failed to mark product as active.");
    }
  };

  const downloadProducts = async (): Promise<void> => {
    try {
      setProductLoading(true);
      await syncProducts();
      message.success("Products downloaded successfully!");
      fetchProducts({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortColumn: "name",
        sortDirection: "asc",
        search: searchText,
        active: isActive,
      });
    } catch (error: any) {
      message.error(error.message || "Failed to download products.");
    } finally {
      setProductLoading(false);
    }
  };

  const columns = [
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (text: number) => `$${text}`,
      sorter: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      sorter: true,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "No description",
    },
    {
      title: "Taxable",
      dataIndex: "taxable",
      key: "taxable",
      render: (text: boolean) => (text ? "Yes" : "No"),
      sorter: true,
    },
    {
      title: "Income Account",
      dataIndex: "incomeAccountName",
      key: "incomeAccountName",
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <>
          {isActive ? (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => openDrawer(record)}
                style={{ marginRight: 8 }}
              />
              <Popconfirm
                title="Are you sure you want to delete this product?"
                onConfirm={() => handleDelete(record.id.toString())}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
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
      <Title level={2}>Products</Title>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col></Col>
        <Col>
          <Search
            placeholder="Search products"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 250 }}
          />

          <Button
            type="primary"
            style={{ marginLeft: 10 }}
            icon={<PlusOutlined />}
            onClick={() => openDrawer()}
          >
            Add Product
          </Button>

          <Button
            type="primary"
            style={{ marginLeft: 10 }}
            icon={<DownloadOutlined />}
            onClick={downloadProducts}
            loading={productLoading}
          >
            Sync Products
          </Button>

          <Checkbox
            style={{ marginLeft: 10 }}
            onChange={(e) => {
              const checked = e.target.checked;
              fetchProducts({
                page: 1,
                pageSize: pagination.pageSize,
                sortColumn: "name",
                sortDirection: "asc",
                search: searchText,
                active: checked,
              });
              setIsActive(checked);
            }}
            checked={isActive}
          >
            Active Products
          </Checkbox>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={false}
        rowKey="id"
        onChange={handleSortChange}
      />

      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showSizeChanger={true}
            pageSizeOptions={["10", "20", "30"]}
            onShowSizeChange={(current, size) =>
              handlePageChange(current, size)
            }
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </Col>
      </Row>

      <Drawer
        title={isEditMode ? "Edit Product" : "Add Product"}
        open={visible}
        onClose={closeDrawer}
        width={600}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={closeDrawer} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
            >
              {isEditMode ? "Update Product" : "Add Product"}
            </Button>
          </div>
        }
        destroyOnClose
      >
        <ProductForm
          initialValues={currentProduct}
          form={form}
          handleFormSubmit={handleFormSubmit}
          isEditMode={isEditMode}
          incomeAccounts={incomeAccounts}
          expenseAccounts={expenseAccounts}
        />
      </Drawer>
    </div>
  );
};

export default Products;
