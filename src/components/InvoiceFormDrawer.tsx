import React from "react";
import {
  Drawer,
  Form,
  Select,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Table,
  Typography,
} from "antd";
import moment from "moment";
import {
  Invoice,
  Customer,
  Product,
  LineItem,
  InvoiceFormValues,
} from "./../interfaces";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface InvoiceFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  form: any;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  handleCustomerChange: (customerId: number) => void;
  handleAddLineItem: () => void;
  handleRemoveLineItem: (index: number) => void;
  onFinish: (values: InvoiceFormValues) => void;
  editingInvoice: Invoice | null;
  saving: boolean;
  lineItemsError: string;
}
const calculateTotal = (items: LineItem[]) => {
  const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
  return { subtotal, total: subtotal };
};

const InvoiceFormDrawer: React.FC<InvoiceFormDrawerProps> = ({
  visible,
  onClose,
  customers,
  products,
  form,
  lineItems,
  setLineItems,
  handleCustomerChange,
  handleAddLineItem,
  handleRemoveLineItem,
  onFinish,
  editingInvoice,
  saving,
  lineItemsError,
}) => {
  const lineItemColumns = [
    {
      title: "Product",
      dataIndex: "productId",
      width: "25%",
      render: (_: any, record: LineItem, index: number) => {
        // const selectedProduct = products.find((p) => p.qbItemId === record.productId?.toString());
        return (
          <Form.Item
            style={{ margin: 0 }}
            validateStatus={!record.productId ? "error" : ""}
            help={!record.productId ? "Required" : ""}
          >
            <Select
              style={{ width: "100%" }}
              placeholder="Select Product"
              value={record.productId}
              status={!record.productId ? "error" : undefined}
              onChange={(value) => {
                const product = products.find((p) => p.qbItemId == value);
                const updated = [...lineItems];
                updated[index] = {
                  ...record,
                  productId: product?.qbItemId,
                  description: product?.name || "",
                  rate: product?.unitPrice || 0,
                  amount: (record.quantity || 1) * (product?.unitPrice || 0),
                };
                setLineItems(updated);
              }}
              options={products.map((product) => ({
                value: product.qbItemId,
                label: product.name,
              }))}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (_: any, record: LineItem, index: number) => (
        <Form.Item
          style={{ margin: 0 }}
          validateStatus={!record.description ? "error" : ""}
          help={!record.description ? "Required" : ""}
        >
          <Input
            value={record.description}
            status={!record.description ? "error" : undefined}
            onChange={(e) => {
              const updated = [...lineItems];
              updated[index].description = e.target.value;
              setLineItems(updated);
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      render: (_: any, record: LineItem, index: number) => (
        <Form.Item
          style={{ margin: 0 }}
          validateStatus={
            !record.quantity || record.quantity <= 0 ? "error" : ""
          }
          help={!record.quantity || record.quantity <= 0 ? "Invalid" : ""}
        >
          <Input
            type="number"
            min={1}
            value={record.quantity}
            status={
              !record.quantity || record.quantity <= 0 ? "error" : undefined
            }
            onChange={(e) => {
              const updated = [...lineItems];
              const quantity = parseFloat(e.target.value) || 0;
              updated[index].quantity = quantity;
              updated[index].amount = quantity * (updated[index].rate || 0);
              setLineItems(updated);
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Rate",
      dataIndex: "rate",
      render: (_: any, record: LineItem, index: number) => (
        <Input
          type="number"
          value={record.rate}
          prefix="$"
          onChange={(e) => {
            const updated = [...lineItems];
            const rate = parseFloat(e.target.value) || 0;
            updated[index].rate = rate;
            updated[index].amount = (record.quantity || 1) * rate;
            setLineItems(updated);
          }}
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (_: any, record: LineItem) => (
        <span>${(record.amount || 0).toFixed(2)}</span>
      ),
    },
    {
      title: "Remove",
      render: (_: any, __: any, index: number) => (
        <Button danger onClick={() => handleRemoveLineItem(index)}>
          <DeleteOutlined />
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title={editingInvoice ? "Edit Invoice" : "New Invoice"}
      open={visible}
      onClose={onClose}
      width={1200}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            Save Invoice
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          invoiceDate: moment(),
          dueDate: moment().add(30, "days"),
          store: "Main Store",
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Customer"
              name="customer"
              rules={[{ required: true, message: "Please select a customer" }]}
            >
              <Select
                placeholder="Select Customer"
                onChange={handleCustomerChange}
                options={customers.map((c) => ({
                  value: c.qbId,
                  label: c.displayName,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Customer Email"
              name="customerEmail"
              rules={[{ type: "email", message: "Invalid email format" }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Invoice Date"
              name="invoiceDate"
              rules={[{ required: true, message: "Invoice date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Due Date"
              name="dueDate"
              rules={[{ required: true, message: "Due date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Store"
              name="store"
              rules={[{ required: true, message: "Please select a store" }]}
            >
              <Select
                placeholder="Select Store"
                options={[{ value: "Main Store", label: "Main Store" }]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Billing Address"
              name="billingAddress"
              rules={[
                { required: true, message: "Billing address is required" },
                { min: 5, message: "Address should be at least 5 characters" },
              ]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Line Items
        </Typography.Title>

        {lineItemsError && (
          <div style={{ marginBottom: 0 }}>
            <Text type="danger" style={{ fontSize: 2 }}>
              {lineItemsError}
            </Text>
          </div>
        )}

        <Table
          dataSource={lineItems}
          columns={lineItemColumns}
          rowKey="id"
          pagination={false}
          footer={() => {
            const { subtotal, total } = calculateTotal(lineItems);
            return (
              <div>
                <Row justify="end">
                  <Col span={8}>
                    <div style={{ textAlign: "right", paddingRight: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Subtotal:</Text> ${subtotal.toFixed(2)}
                      </div>
                      <div>
                        <Text strong>Total:</Text> ${total.toFixed(2)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            );
          }}
        />

        <Button
          type="dashed"
          onClick={handleAddLineItem}
          style={{ width: "100%", marginTop: 16 }}
        >
          + Add Line Item
        </Button>
      </Form>
    </Drawer>
  );
};

export default InvoiceFormDrawer;
