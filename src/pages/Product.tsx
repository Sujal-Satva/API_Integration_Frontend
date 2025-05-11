// import React, { useState, useEffect } from "react";
// import {
//   Button,
//   Table,
//   Pagination,
//   message,
//   Form,
//   Drawer,
//   Typography,
//   Row,
//   Col,
//   Popconfirm,
//   Input,
//   Checkbox,
// } from "antd";
// import {
//   EditOutlined,
//   DeleteOutlined,
//   DownloadOutlined,
//   PlusOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";
// import { Product, PaginationState, AccountOption } from "../interfaces";
// import {
//   createProduct,
//   deleteProduct,
//   getAccounts,
//   syncProducts,
//   updateProduct,
//   getProducts,
//   markProductAsActive,
// } from "../services/productService";
// import ProductForm from "../components/ProductForm";

// const { Title } = Typography;
// const { Search } = Input;

// export const Products: React.FC = () => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [pagination, setPagination] = useState<PaginationState>({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//     totalPages: 1,
//   });
//   const [loading, setLoading] = useState<boolean>(false);
//   const [visible, setVisible] = useState<boolean>(false);
//   const [isEditMode, setIsEditMode] = useState<boolean>(false);
//   const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
//   const [searchText, setSearchText] = useState<string>("");
//   const [productLoading, setProductLoading] = useState<boolean>(false);
//   const [incomeAccounts, setIncomeAccounts] = useState<AccountOption[]>([]);
//   const [expenseAccounts, setExpenseAccounts] = useState<AccountOption[]>([]);
//   const [isActive, setIsActive] = useState<boolean>(true);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     fetchProducts({
//       page: pagination.current,
//       pageSize: pagination.pageSize,
//       sortColumn: "name",
//       sortDirection: "asc",
//       search: searchText,
//       active: isActive,
//     });
//     loadAccounts();
//   }, []);

//   const loadAccounts = async () => {
//     try {
//       const accounts = await getAccounts();
//       setIncomeAccounts(accounts.incomeAccounts);
//       setExpenseAccounts(accounts.expenseAccounts);
//     } catch (error) {
//       console.error("Failed to preload accounts:", error);
//     }
//   };

//   interface FetchProductParams {
//     page?: number;
//     pageSize?: number;
//     sortColumn?: string;
//     sortDirection?: string;
//     search?: string;
//     active?: boolean;
//   }

//   const fetchProducts = async ({
//     page = 1,
//     pageSize = 10,
//     sortColumn = "name",
//     sortDirection = "asc",
//     search = "",
//     active = true,
//   }: FetchProductParams): Promise<void> => {
//     setLoading(true);
//     try {
//       const response = await getProducts(
//         page,
//         pageSize,
//         sortColumn,
//         sortDirection,
//         search,
//         active
//       );

//       setProducts(response.data);
//       setPagination({
//         current: response.page ?? 1,
//         pageSize: response.pageSize ?? 10,
//         total: response.totalRecords ?? 0,
//         totalPages: response.totalPages,
//       });
//     } catch (error) {
//       message.error("Failed to fetch products.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePageChange = (page: number, pageSize?: number): void => {
//     fetchProducts({
//       page,
//       pageSize: pageSize || pagination.pageSize,
//       sortColumn: "name",
//       sortDirection: "asc",
//       search: searchText,
//       active: isActive,
//     });
//   };

//   const handleSortChange = (_: any, __: any, sorter: any): void => {
//     const { columnKey, order } = sorter;
//     const sortDirection = order === "ascend" ? "asc" : "desc";
//     fetchProducts({
//       page: pagination.current,
//       pageSize: pagination.pageSize,
//       sortColumn: columnKey || "name",
//       sortDirection,
//       search: searchText,
//       active: isActive,
//     });
//   };

//   const handleSearch = (value: string): void => {
//     setSearchText(value);
//     fetchProducts({
//       page: 1,
//       pageSize: pagination.pageSize,
//       sortColumn: "name",
//       sortDirection: "asc",
//       search: value,
//       active: isActive,
//     });
//   };

//   const openDrawer = (product: Product | null = null): void => {
//     setIsEditMode(!!product);
//     setCurrentProduct(product);
//     setVisible(true);
//     form.resetFields();

//     if (product) {
//       form.setFieldsValue({
//         ...product,
//         incomeAccountName: product.incomeAccountName,
//         expenseAccountName: product.expenseAccountName,
//       });
//     }
//   };

//   const closeDrawer = (): void => {
//     setVisible(false);
//     setCurrentProduct(null);
//     form.resetFields();
//   };

//   const handleFormSubmit = async (values: any): Promise<void> => {
//     setLoading(true);
//     try {
//       const selectedIncomeAccount = incomeAccounts.find(
//         (acc) => acc.name === values.incomeAccountName
//       );
//       if (!selectedIncomeAccount) {
//         throw new Error("Invalid income account selected");
//       }

//       const payload: Partial<Product> = {
//         name: values.name,
//         type: values.type,
//         fullyQualifiedName: values.name,
//         unitPrice: values.unitPrice,
//         taxable: values.taxable || false,
//         description: values.description || "",
//         incomeAccountValue: selectedIncomeAccount?.id || "",
//         incomeAccountName: selectedIncomeAccount?.name || "",
//       };

//       if (values.type === "Inventory") {
//         const selectedExpenseAccount = expenseAccounts.find(
//           (acc) => acc.name === values.expenseAccountName
//         );
//         if (!selectedExpenseAccount) {
//           throw new Error(
//             "Invalid expense account selected for inventory item"
//           );
//         }
//         payload.expenseAccountValue = selectedExpenseAccount?.id || "";
//         payload.expenseAccountName = selectedExpenseAccount?.name || "";
//       }

//       if (isEditMode && currentProduct) {
//         await updateProduct(currentProduct.id.toString(), payload);
//         message.success("Product updated!");
//       } else {
//         await createProduct(payload);
//         message.success("Product added!");
//       }

//       fetchProducts({
//         page: pagination.current,
//         pageSize: pagination.pageSize,
//         sortColumn: "name",
//         sortDirection: "asc",
//         search: searchText,
//         active: isActive,
//       });
//       closeDrawer();
//     } catch (error: any) {
//       message.error(error.message || "Error while saving product.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id: string): Promise<void> => {
//     try {
//       setLoading(true);
//       await deleteProduct(id);
//       message.success("Product deleted successfully!");
//       fetchProducts({
//         page: pagination.current,
//         pageSize: pagination.pageSize,
//         sortColumn: "name",
//         sortDirection: "asc",
//         search: searchText,
//         active: isActive,
//       });
//     } catch (error: any) {
//       message.error(
//         error.message || "An error occurred while deleting the product."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkAsActive = async (id: string) => {
//     try {
//       // console.log(id);
//       await markProductAsActive(id);
//       message.success("Product marked as active.");
//       fetchProducts({});
//     } catch (error) {
//       console.log(error);
//       message.error("Failed to mark product as active.");
//     }
//   };

//   const downloadProducts = async (): Promise<void> => {
//     try {
//       setProductLoading(true);
//       await syncProducts();
//       message.success("Products downloaded successfully!");
//       fetchProducts({
//         page: pagination.current,
//         pageSize: pagination.pageSize,
//         sortColumn: "name",
//         sortDirection: "asc",
//         search: searchText,
//         active: isActive,
//       });
//     } catch (error: any) {
//       message.error(error.message || "Failed to download products.");
//     } finally {
//       setProductLoading(false);
//     }
//   };

//   const columns = [
//     {
//       title: "Product Name",
//       dataIndex: "name",
//       key: "name",
//       sorter: true,
//     },
//     {
//       title: "Unit Price",
//       dataIndex: "unitPrice",
//       key: "unitPrice",
//       render: (text: number) => `$${text}`,
//       sorter: true,
//     },
//     {
//       title: "Type",
//       dataIndex: "type",
//       key: "type",
//       sorter: true,
//     },
//     {
//       title: "Description",
//       dataIndex: "description",
//       key: "description",
//       render: (text: string) => text || "No description",
//     },
//     {
//       title: "Taxable",
//       dataIndex: "taxable",
//       key: "taxable",
//       render: (text: boolean) => (text ? "Yes" : "No"),
//       sorter: true,
//     },
//     {
//       title: "Income Account",
//       dataIndex: "incomeAccountName",
//       key: "incomeAccountName",
//       sorter: true,
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: any, record: Product) => (

//         <>
//           {isActive ? (
//             <>
//               <Button
//                 icon={<EditOutlined />}
//                 onClick={() => openDrawer(record)}
//                 style={{ marginRight: 8 }}
//               />
//               <Popconfirm
//                 title="Are you sure you want to delete this product?"
//                 onConfirm={() => handleDelete(record.id.toString())}
//                 okText="Yes"
//                 cancelText="No"
//               >
//                 <Button icon={<DeleteOutlined />} danger />
//               </Popconfirm>
//             </>
//           ) : (
//             <Button
//               type="primary"
//               onClick={() => {handleMarkAsActive(record.qbItemId)
//               }}
//             >
//               Mark as Active
//             </Button>
//           )}
//         </>
//       ),
//     },
//   ];
//   return (
//     <div className="p-6">
//       <Title level={2}>Products</Title>

//       <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
//         <Col></Col>
//         <Col>
//           <Search
//             placeholder="Search products"
//             allowClear
//             enterButton={<SearchOutlined />}
//             onSearch={handleSearch}
//             style={{ width: 250 }}
//           />

//           <Button
//             type="primary"
//             style={{ marginLeft: 10 }}
//             icon={<PlusOutlined />}
//             onClick={() => openDrawer()}
//           >
//             Add Product
//           </Button>

//           <Button
//             type="primary"
//             style={{ marginLeft: 10 }}
//             icon={<DownloadOutlined />}
//             onClick={downloadProducts}
//             loading={productLoading}
//           >
//             Sync Products
//           </Button>

//           {/* <Checkbox
//             style={{ marginLeft: 10 }}
//             onChange={(e) => {
//               const checked = e.target.checked;
//               fetchProducts({
//                 page: 1,
//                 pageSize: pagination.pageSize,
//                 sortColumn: "name",
//                 sortDirection: "asc",
//                 search: searchText,
//                 active: checked,
//               });
//               setIsActive(checked);
//             }}
//             checked={isActive}
//           >
//             Active Products
//           </Checkbox> */}
//         </Col>
//       </Row>

//       <Table
//         columns={columns}
//         dataSource={products}
//         loading={loading}
//         pagination={false}
//         rowKey="id"
//         onChange={handleSortChange}
//       />

//       <Row justify="end" style={{ marginTop: 16 }}>
//         <Col>
//           <Pagination
//             current={pagination.current}
//             pageSize={pagination.pageSize}
//             total={pagination.total}
//             onChange={handlePageChange}
//             showSizeChanger={true}
//             pageSizeOptions={["10", "20", "30"]}
//             onShowSizeChange={(current, size) =>
//               handlePageChange(current, size)
//             }
//             showTotal={(total, range) =>
//               `${range[0]}-${range[1]} of ${total} items`
//             }
//           />
//         </Col>
//       </Row>

//       <Drawer
//         title={isEditMode ? "Edit Product" : "Add Product"}
//         open={visible}
//         onClose={closeDrawer}
//         width={600}
//         footer={
//           <div style={{ textAlign: "right" }}>
//             <Button onClick={closeDrawer} style={{ marginRight: 8 }}>
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={() => form.submit()}
//               loading={loading}
//             >
//               {isEditMode ? "Update Product" : "Add Product"}
//             </Button>
//           </div>
//         }
//         destroyOnClose
//       >
//         <ProductForm
//           initialValues={currentProduct}
//           form={form}
//           handleFormSubmit={handleFormSubmit}
//           isEditMode={isEditMode}
//           incomeAccounts={incomeAccounts}
//           expenseAccounts={expenseAccounts}
//         />
//       </Drawer>
//     </div>
//   );
// };

// export default Products;


import { Table, Typography, Input, Button, message, Select, Form, Popconfirm, Radio, Switch } from "antd";
import { useEffect, useState } from "react";
import { EditOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import { productService } from "../services/productService";
import { useAuth } from "../context/AuthContext";

import { ProductDrawer } from "../components/ProductDrawer";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
interface Account {
  id: string;
  xeroId: string;
  quickBooksId: string;
  name: string;
  accountType: string;
  active: boolean;
  accountSubType: string;
  currentBalance: number;
  currencyName: string;
  sourceSystem: string;
}

interface SortInfo {
  field: string;
  order: SortOrder;
}

export const Product = () => {
  const [data, setData] = useState<Account[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [quickbooksLoading, setQuickBooksLoading] = useState<boolean>(false);
  const [xeroLoading, setXeroLoading] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [souceType, setSourceType] = useState<string>("");
  const [showactive, setShowactive] = useState(true);
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    field: "name",
    order: "ascend",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(searchText);
      const result = await productService.getAllProducts(
        page,
        pageSize,
        searchText,
        sortInfo.field,
        sortInfo.order === "descend" ? "desc" : "asc",
        sourceFilter,
        showactive,
        souceType
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
  }, [page, pageSize, searchText, sortInfo, sourceFilter, showactive, souceType]);
  useEffect(() => {
    setPage(1);
    setPageSize(10);
    setSortInfo({ field: "name", order: "ascend" });
    setSearchText("");
    // setSourceType("");
  }, [sourceFilter, showactive, souceType]);


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
      const response = await productService.fetchProducts(platform);
      if (response.status === 200) {
        message.success(response.message);
        fetchData();
      } else {
        message.error("Failed to download.");
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

  const toggleProductActiveStatus = async (record: Account, isActive: boolean, platform: string) => {
    try {
      console.log(record, isActive, platform);
      if (platform === "Xero" && isActive == true) {
        message.error("Xero does not support activating customers.");
        return;
      }
      await productService.updateProductStatus(
        record.externalId,
        isActive
        , platform
      );
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const { connectedAccounts } = useAuth();
  const columns: ColumnsType<UnifiedItem> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      width: 200,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: false,
    },
    {
      title: "Type",
      dataIndex: "isTrackedAsInventory",
      key: "isTrackedAsInventory",
      render: (text) => (text ? "Inventory" : "Service"),
    },
    {
      title: "Sales Price",
      dataIndex: "salesUnitPrice",
      key: "salesUnitPrice",
      sorter: true,
    },
    {
      title: "Purchase Price",
      dataIndex: "purchaseUnitPrice",
      key: "purchaseUnitPrice",
      sorter: true,
    },
    {
      title: "Source System",
      dataIndex: "sourceSystem",
      key: "sourceSystem",
      width: 150,
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "lastUpdated",
      sorter: true,
      render: (text) => new Date(text).toLocaleString(),
      width: 200,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (text, record) => (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {record.isActive ? (
            <>
              <Button type="link" onClick={() => openDrawer(record)} icon={<EditOutlined />} />
              <Popconfirm
                title={`Are you sure you want to deactivate this product?`}
                onConfirm={() => toggleProductActiveStatus(record, false, record.sourceSystem)}
                okText="Yes"
                cancelText="No"
              >
                <Switch checked={record.isActive} size="small" />
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              title={`Are you sure you want to activate this product?`}
              onConfirm={() => toggleProductActiveStatus(record, true, record.sourceSystem)}
              okText="Yes"
              cancelText="No"
            >
              <Switch checked={record.isActive} size="small" />
            </Popconfirm>
          )}
        </div>
      ),
    },
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

      let itemPayload: any;

      if (platform === "Xero") {
        itemPayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          isSold: values.isSold,
          isPurchased: values.isPurchased,
          isTrackedAsInventory: values.isTrackedAsInventory,
          salesUnitPrice: values.salesUnitPrice,
          purchaseUnitPrice: values.isTrackedAsInventory ? values.purchaseUnitPrice : null,
          salesAccountCode: values.isSold ? 200 : null,
          purchaseAccountCode: values.isPurchased ? 310 : null,
          salesTaxType: values.isSold ? "INPUT" : null,
          purchaseTaxType: values.isPurchased ? "OUTPUT" : null,
          inventoryAssetAccountCode: values.isTrackedAsInventory ? 630 : null
        };
      } else if (platform === "QuickBooks") {
        const isInventory = values.type === "Inventory";
        itemPayload = {
          Name: values.name,
          IsActive: true,
          Type: values.type,
          Description: values.description,
          SalesUnitPrice: values.salesUnitPrice,
          PurchaseUnitPrice: isInventory ? values.purchaseUnitPrice : null,
          TrackQtyOnHand: isInventory,
          QtyOnHand: isInventory ? values.qtyOnHand || 1 : 1,
          InvStartDate:
            isInventory && (values.qtyOnHand || 0) > 0
              ? (values.invStartDate
                ? new Date(values.invStartDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0])
              : null
        };
      } else {
        message.error("Unsupported platform.");
        return;
      }

      console.log(`${platform} Payload:`, itemPayload);

      if (editingCustomer) {
        await productService.editProduct(itemPayload, platform, values.externalId);
      } else {
        await productService.addProduct(itemPayload, platform);
      }
      fetchData();
      closeDrawer();
    } catch (error) {
      console.error(error);
      message.error("Operation failed.");
    } finally {
      setDrawerLoading(false);
    }
  };


  return (
    <div className="p-6">

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 0 }}>
        <Title level={2}>Products</Title>
        <Button type="primary" onClick={() => openDrawer()} style={{ marginBottom: 10 }}>
          <PlusOutlined /> Add Product </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Search
          placeholder="Search value"
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

          <Select
            defaultValue=""
            onChange={(value) => setSourceType(value)}
            style={{ width: 100 }}
          >
            <Option value="">All</Option>
            <Option value="Service">Service</Option>
            <Option value="Inventory">Inventory</Option>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch checked={showactive} onChange={setShowactive} />
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

      <ProductDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        product={editingCustomer}
        form={form}
        loading={drawerLoading}
      />

    </div>
  );
};

