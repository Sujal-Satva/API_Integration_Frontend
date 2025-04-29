import React, { FC, useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Divider,
  Row,
  Col,
  InputNumber,
  Table,
  Popconfirm,
  message,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Vendor,
  Category,
  Product,
  Customer,
  CategoryDetail,
  ItemDetail,
  BillFormData,
} from "./../interfaces";
import {
  formatCurrency,
  calculateTotal,
  buildQuickBooksBillPayload,
  formatQBDate,
} from "../utils";
import { saveBill } from "../services/billService";

const { Option } = Select;
const { TextArea } = Input;

interface BillFormProps {
  vendors: Vendor[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  onCancel: () => void;
  onSuccess: () => void;
  selectedVendorFromVendor?: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const BillForm: FC<BillFormProps> = ({
  selectedVendorFromVendor = "",
  vendors,
  categories,
  products,
  customers,
  onCancel,
  onSuccess,
  loading,
}) => {
  const [form] = Form.useForm();
  const [selectedVendor, setSelectedVendor] = useState<string | null>(
    selectedVendorFromVendor !== "" ? selectedVendorFromVendor : null
  );
  console.log(selectedVendorFromVendor);
  const [vendorAddress, setVendorAddress] = useState<string>("");
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetail[]>([
    {
      id: Date.now(),
      categoryId: null,
      description: "",
      amount: 0,
      customerId: null,
    },
  ]);
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([
    {
      id: Date.now(),
      productId: null,
      qty: 1,
      rate: 0,
      amount: 0,
      customerId: null,
    },
  ]);

  // Set initial form values
  useEffect(() => {
    handleVendorChange(parseInt(selectedVendorFromVendor));
    form.setFieldsValue({
      vendorId: selectedVendorFromVendor,
      billDate: dayjs(),
      dueDate: dayjs(),
    });
  }, [form,selectedVendorFromVendor]);

  const handleVendorChange = (value: number) => {
    
    const selectedVendorData = vendors.find((v) => v.id == value);
    if (selectedVendorData) {
      setSelectedVendor(selectedVendorData.vId);
      if ((selectedVendorData.billAddrLine1 ?? "").length > 0) {
        setVendorAddress(
          `${selectedVendorData.billAddrLine1} ${
            selectedVendorData.billAddrCity || ""
          } ${selectedVendorData.billAddrPostalCode || ""}`
        );
      } else {
        setVendorAddress(selectedVendorData.displayName || "");
      }
    } else {
      setVendorAddress("");
      setSelectedVendor(null);
    }
  };

  // Handle category detail changes
  const handleCategoryDetailChange = (
    id: number,
    field: keyof CategoryDetail,
    value: any
  ) => {
    if (field === "categoryId") {
      const selectedAccount = categories.find(
        (c) => c.quickBooksAccountId === value
      );
      console.log(selectedAccount);
      if (
        selectedAccount &&
        (selectedAccount.accountType === "Accounts Payable" ||
          selectedAccount.accountType === "Accounts Receivable")
      ) {
        message.error(`You cannot select ${selectedAccount.name} in a Bill`);
        return;
      }
    }
    setCategoryDetails(
      categoryDetails.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle item detail changes
  const handleItemDetailChange = (
    id: number,
    field: keyof ItemDetail,
    value: any
  ) => {
    setItemDetails(
      itemDetails.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "productId") {
            const product = products.find((p) => p.id === value);
            if (product && product.unitPrice) {
              updatedItem.rate = product.unitPrice;
              updatedItem.amount = (updatedItem.qty || 1) * product.unitPrice;
            }
          } else if (field === "rate" || field === "qty") {
            updatedItem.amount =
              (updatedItem.qty || 0) * (updatedItem.rate || 0);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Add category detail row
  const addCategoryDetail = () => {
    setCategoryDetails([
      ...categoryDetails,
      {
        id: Date.now(),
        categoryId: null,
        description: "",
        amount: 0,
        customerId: null,
      },
    ]);
  };

  // Remove category detail row
  const removeCategoryDetail = (id: number) => {
    setCategoryDetails(categoryDetails.filter((item) => item.id !== id));
  };

  // Add item detail row
  const addItemDetail = () => {
    setItemDetails([
      ...itemDetails,
      {
        id: Date.now(),
        productId: null,
        qty: 1,
        rate: 0,
        amount: 0,
        customerId: null,
      },
    ]);
  };

  // Remove item detail row
  const removeItemDetail = (id: number) => {
    setItemDetails(itemDetails.filter((item) => item.id !== id));
  };

  const handleFormSubmit = async () => {
    try {
      const isNonEmpty = (value: any) =>
        value !== null && value !== undefined && value !== "";

      const values = await form.validateFields();

      const processedCategoryDetails = categoryDetails
        .filter(
          (item) => isNonEmpty(item.categoryId) && isNonEmpty(item.amount)
        )
        .map((item) => {
          const category = categories.find(
            (c) => c.quickBooksAccountId === item.categoryId
          );
          return {
            ...item,
            qbAccountId: category?.quickBooksAccountId || item.categoryId,
          };
        });

      const processedItemDetails = itemDetails
        .filter((item) => isNonEmpty(item.productId) && isNonEmpty(item.amount))
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            ...item,
            qbItemId: product?.qbItemId || String(item.productId),
          };
        });

      if (processedCategoryDetails.length === 0) {
        message.error("Please add at least one valid category detail.");
        return;
      }
      if (
        processedCategoryDetails.length === 0 &&
        processedItemDetails.length === 0
      ) {
        message.error("Please fill the details correctly.");
        return;
      }

      if (!selectedVendor) {
        message.error("Please select a vendor.");
        return;
      }

      const billData: BillFormData = {
        ...values,
        categoryDetails: processedCategoryDetails,
        itemDetails: processedItemDetails,
        totalAmt: calculateTotal(categoryDetails, itemDetails),
        billDate: formatQBDate(values.billDate),
        dueDate: formatQBDate(values.dueDate),
      };

      const payload = buildQuickBooksBillPayload(
        billData,
        selectedVendor,
        categories,
        products
      );

      const success = await saveBill(payload);
      console.log(success, "success");
      if (success) {
        onSuccess();
        resetForm();
      }
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setSelectedVendor(null);
    setVendorAddress("");
    setCategoryDetails([
      {
        id: Date.now(),
        categoryId: null,
        description: "",
        amount: 0,
        customerId: null,
      },
    ]);
    setItemDetails([
      {
        id: Date.now(),
        productId: null,
        qty: 1,
        rate: 0,
        amount: 0,
        customerId: null,
      },
    ]);
  };

  // Category details columns
  const categoryColumns = [
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (_: any, record: CategoryDetail) => (
        <Form.Item
          name={["categoryDetails", record.id, "categoryId"]}
          rules={[{ required: true, message: "Please select a category" }]}
          style={{ margin: 0, fontSize: "2px" }} // removes extra spacing
        >
          <Select
            placeholder="Select Category"
            style={{ width: "100%" }}
            value={record.categoryId}
            onChange={(value) => {
              handleCategoryDetailChange(record.id, "categoryId", value);
            }}
          >
            {categories.map((category) => (
              <Select.Option
                key={category.quickBooksAccountId}
                value={category.quickBooksAccountId}
              >
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (_: any, record: CategoryDetail) => (
        <Input
          placeholder="Description"
          value={record.description}
          onChange={(e) =>
            handleCategoryDetailChange(record.id, "description", e.target.value)
          }
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_: any, record: CategoryDetail) => (
        <InputNumber
          placeholder="Amount"
          style={{ width: "100%" }}
          value={record.amount}
          onChange={(value) =>
            handleCategoryDetailChange(record.id, "amount", value)
          }
          formatter={(value) =>
            `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => (value || "").replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerId",
      key: "customerId",
      render: (_: any, record: CategoryDetail) => (
        <Select
          placeholder="Select Customer"
          style={{ width: "100%" }}
          value={record.customerId}
          onChange={(value) =>
            handleCategoryDetailChange(record.id, "customerId", value)
          }
          allowClear
        >
          {customers.map((customer) => (
            <Option key={customer.id} value={customer.id}>
              {customer.displayName}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: CategoryDetail) => (
        <Popconfirm
          title="Are you sure you want to remove this line?"
          onConfirm={() => removeCategoryDetail(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  // Item details columns
  const itemColumns = [
    {
      title: "Product/Service",
      dataIndex: "productId",
      key: "productId",
      render: (_: any, record: ItemDetail) => (
        <Select
          placeholder="Select Product"
          style={{ width: "100%" }}
          value={record.productId}
          onChange={(value) => {
            handleItemDetailChange(record.id, "productId", value);
          }}
        >
          {products.map((product) => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      render: (_: any, record: ItemDetail) => (
        <InputNumber
          placeholder="Qty"
          style={{ width: "100%" }}
          min={0}
          value={record.qty}
          onChange={(value) =>
            handleItemDetailChange(record.id, "qty", value || 0)
          }
        />
      ),
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (_: any, record: ItemDetail) => (
        <InputNumber
          placeholder="Rate"
          style={{ width: "100%" }}
          value={record.rate}
          onChange={(value) =>
            handleItemDetailChange(record.id, "rate", value || 0)
          }
          formatter={(value) =>
            `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => (value || "").replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_: any, record: ItemDetail) => (
        <InputNumber
          placeholder="Amount"
          style={{ width: "100%" }}
          value={record.amount}
          disabled
          formatter={(value) =>
            `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => (value || "").replace(/\$\s?|(,*)/g, "")}
        />
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerId",
      key: "customerId",
      render: (_: any, record: ItemDetail) => (
        <Select
          placeholder="Select Customer"
          style={{ width: "100%" }}
          value={record.customerId}
          onChange={(value) =>
            handleItemDetailChange(record.id, "customerId", value)
          }
          allowClear
        >
          {customers.map((customer) => (
            <Option key={customer.id} value={customer.id}>
              {customer.displayName}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ItemDetail) => (
        <Popconfirm
          title="Are you sure you want to remove this line?"
          onConfirm={() => removeItemDetail(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const total = calculateTotal(categoryDetails, itemDetails);

  return (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="vendorId"
            label="Vendor"
            rules={[{ required: true, message: "Please select a vendor" }]}
          >
            <Select
              placeholder="Select Vendor"
              onChange={handleVendorChange}
              showSearch
              optionFilterProp="children"
              value={selectedVendor}
              // defaultValue={parseInt(selectedVendor)}
            >
              {vendors.map((vendor) => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Mailing Address">
            <TextArea value={vendorAddress} rows={3} disabled />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="billDate"
            label="Bill Date"
            rules={[{ required: true, message: "Please select bill date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true, message: "Please select due date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Category Details</Divider>
      <Table
        columns={categoryColumns}
        dataSource={categoryDetails}
        style={{ padding: "10px" }}
        pagination={false}
        rowKey="id"
        size="small"
      />
      <Button
        type="dashed"
        onClick={addCategoryDetail}
        style={{ width: "100%", marginTop: 8 }}
        icon={<PlusOutlined />}
      >
        Add Category Line
      </Button>

      <Divider orientation="left">Item Details</Divider>
      <Table
        columns={itemColumns}
        dataSource={itemDetails}
        pagination={false}
        rowKey="id"
        size="small"
      />
      <Button
        type="dashed"
        onClick={addItemDetail}
        style={{ width: "100%", marginTop: 8 }}
        icon={<PlusOutlined />}
      >
        Add Item Line
      </Button>

      <Row style={{ marginTop: 16 }}>
        <Col span={12} offset={12}>
          <div style={{ textAlign: "right" }}>
            <strong>Total: {formatCurrency(total)}</strong>
          </div>
        </Col>
      </Row>

      <Form.Item
        name="privateNote"
        label="Memo/Private Note"
        style={{ marginTop: 16 }}
      >
        <TextArea rows={3} placeholder="Add any notes here..." />
      </Form.Item>

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button
          onClick={onCancel}
          icon={<CloseOutlined />}
          style={{ marginRight: 8 }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleFormSubmit}
          icon={<SaveOutlined />}
        >
          Save Bill
        </Button>
      </div>
    </Form>
  );
};

export default BillForm;
