  import React, { useEffect, useState } from "react";
  import {
    Drawer, Form, Input, DatePicker, Select, Button,
    Divider, Typography, Table, InputNumber, Space, Alert,
    Tabs, Card, FormInstance,
    Row
  } from "antd";
  import {
    PlusOutlined, DeleteOutlined, SaveOutlined
  } from "@ant-design/icons";
  import moment from "moment";
  import { ColumnType } from "antd/lib/table";
  import { Col } from "antd/lib";

  const { Option } = Select;
  const { Title, Text } = Typography;
  interface Customer {
    id?: string;
    qbId?: string;
    externalId?: string;
    name?: string;
    customerName?: string;
    displayName?: string;
    email?: string;
    line1?: string;
    billingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    sourceSystem?: string;
  }

  interface Product {
    id?: string;
    qbItemId?: string;
    name?: string;
    itemName?: string;
    description?: string;
    unitPrice?: number;
    rate?: number;
    active?: boolean;
    sourceSystem?: string;
    externalId?: string; // Added as it's referenced in code but not in interface
    code?: string; // Added as it's referenced in code but not in interface
  }

  interface LineItem {
    id: string;
    productId?: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    accountCode?: string;
  }

  interface InvoiceFormDrawerProps {
    visible: boolean;
    onClose: () => void;
    form: FormInstance;
    customers: Customer[];
    products: Product[];
    lineItems: LineItem[];
    onAddLineItem: () => void;
    onRemoveLineItem: (index: number) => void;
    onUpdateLineItem: (index: number, field: string, value: any) => void;
    onCustomerChange: (customerId: string) => void;
    onFinish: (values: any) => void;
    isEditing: boolean;
    loading: boolean;
    lineItemsError: string;
    setLineItems: (items: LineItem[]) => void; // Added missing prop
  }

  const InvoiceFormDrawer: React.FC<InvoiceFormDrawerProps> = ({
    visible,
    onClose,
    form,
    customers,
    products,
    lineItems,
    onAddLineItem,
    onRemoveLineItem,
    onUpdateLineItem,
    onCustomerChange,
    onFinish,
    isEditing,
    loading,
    lineItemsError,
    setLineItems
  }) => {
    const [selectedSourceSystem, setSelectedSourceSystem] = useState<string>("QuickBooks");
    useEffect(() => {
      if (visible && isEditing) {
        const currentValues = form.getFieldsValue(true);
        if (currentValues) {
          setTimeout(() => {
            form.setFieldsValue(currentValues);
          }, 100);
        }
      }
    }, [visible, isEditing, form]);

    const getProductNameById = (productId?: string): string => {
      if (!productId) return "";
      const product =
        products.find(p => p.externalId === productId) ||
        products.find(p => p.code === productId);

      return product?.name || product?.itemName || "Unknown Product";
    };

    const filteredCustomers = customers.filter(
      customer => !customer.sourceSystem || customer.sourceSystem === selectedSourceSystem
    );

    const filteredProducts = products.filter(
      product => !product.sourceSystem || product.sourceSystem === selectedSourceSystem
    );

    const handleSourceSystemChange = (value: string) => {
      setSelectedSourceSystem(value);
      setLineItems([]);
      form.setFieldsValue({
        customerId: undefined,
        customerName: undefined,
        customerEmail: undefined,
        addresses: [{ line1: undefined, type: "Billing" }]
      });
    };

    useEffect(() => {
      if (visible) {
        const sourceSystem = form.getFieldValue("sourceSystem");
        if (sourceSystem) {
          setSelectedSourceSystem(sourceSystem);
        }

      
        console.log("Form values on visible change:", {
          customerId: form.getFieldValue('customerId'),
          customerName: form.getFieldValue('customerName')
        });
      }
    }, [visible, form]);

    const calculateSubtotal = (): number => {
      return lineItems.reduce((sum, item) => sum + (item.quantity * item.rate || 0), 0);
    };

    const subtotal = calculateSubtotal();
    const total = subtotal; 
    const handleCustomerChange = (customerId: string) => {
    
      const selectedCustomer = customers.find(c => c.externalId === customerId);

      if (selectedCustomer) {
        form.setFieldsValue({
          customerName: selectedCustomer.displayName || selectedCustomer.name || selectedCustomer.customerName,
          customerEmail: selectedCustomer.email,
          addresses: [{
            line1: selectedCustomer.billingAddress || selectedCustomer.line1,
            type: "Billing"
          }]
        });
      }

      // Call the parent handler
      onCustomerChange(customerId);
    };

    // Line items columns
    const lineItemsColumns: ColumnType<LineItem>[] = [
      {
        title: "Product",
        dataIndex: "productId",
        key: "productId",
        width: "25%",
        render: (productId, _, index) => (
          <Select
            placeholder="Select product"
            style={{ width: "100%" }}
            value={getProductNameById(productId)}
            onChange={(value) => onUpdateLineItem(index, "productId", value)}
            showSearch
            optionFilterProp="children"
          >
            {filteredProducts.map((product) => (
              <Option key={product.id || product.qbItemId} value={product.externalId}>
                {product.name || product.itemName}
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        width: "30%",
        render: (description, _, index) => (
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => onUpdateLineItem(index, "description", e.target.value)}
          />
        ),
      },
      {
        title: "Qty",
        dataIndex: "quantity",
        key: "quantity",
        width: "10%",
        render: (quantity, _, index) => (
          <InputNumber
            min={1}
            placeholder="Qty"
            value={quantity}
            onChange={(value) => onUpdateLineItem(index, "quantity", value !== null ? value : 0)}
            style={{ width: "100%" }}
          />
        ),
      },
      {
        title: "Rate",
        dataIndex: "rate",
        key: "rate",
        width: "15%",
        render: (rate, _, index) => (
          <InputNumber
            min={0}
            step={0.01}
            placeholder="Rate"
            value={rate}
            onChange={(value) => onUpdateLineItem(index, "rate", value !== null ? value : 0)}
            style={{ width: "100%" }}
            formatter={(value) => value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
            parser={(value) => value ? String(value).replace(/\$\s?|(,*)/g, '') : ''}
          />
        ),
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        width: "15%",
        render: (_, record) => (
          <Text strong>
            $ {((record.quantity || 0) * (record.rate || 0)).toFixed(2)}
          </Text>
        ),
      },
      {
        title: "",
        key: "action",
        width: "5%",
        render: (_, record, index) => (
          <Button
            icon={<DeleteOutlined />}
            onClick={() => onRemoveLineItem(index)}
            danger
            type="link"
          />
        ),
      },
    ];

    return (
      <Drawer
        title={isEditing ? "Edit Invoice" : "Create New Invoice"}
        width={900}
        visible={visible}
        onClose={onClose}
        destroyOnClose={false} // Changed from true to false to preserve form state
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              icon={<SaveOutlined />}
            >
              {isEditing ? "Update Invoice" : "Create Invoice"}
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
            status: "DRAFT",
            currencyCode: "USD",
            sourceSystem: "QuickBooks"
          }}
          preserve={true} // Preserve form values
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceDate"
                label="Invoice Date"
                rules={[{ required: true, message: "Please select invoice date" }]}
              >
                <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: "Please select due date" }]}
              >
                <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  <Option value="DRAFT">Draft</Option>
                  <Option value="SENT">Sent</Option>
                  <Option value="PAID">Paid</Option>
                  <Option value="OVERDUE">Overdue</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="currencyCode"
                label="Currency"
                rules={[{ required: true, message: "Please select currency" }]}
              >
                <Select disabled={isEditing} placeholder="Select currency">
                  <Option value="USD">USD - US Dollar</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="sourceSystem"
                label="Source System"
                rules={[{ required: true, message: "Please select source system" }]}
              >
                <Select
                  placeholder="Select source"
                  onChange={handleSourceSystemChange}
                  disabled={isEditing}
                >
                  <Option value="QuickBooks">QuickBooks</Option>
                  <Option value="Xero">Xero</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Customer Information</Divider>

          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
          >
            <Select
              placeholder="Select customer"
              onChange={handleCustomerChange}
              showSearch
              optionFilterProp="children"
            >
              {filteredCustomers.map((customer) => (
                <Option key={customer.externalId} value={customer.externalId}>
                  {customer.displayName || customer.name || "Unknown Customer"}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="Customer name" />
          </Form.Item>

          <Form.Item
            name="customerEmail"
            label="Customer Email"
          >
            <Input placeholder="Customer email" />
          </Form.Item>

          <Form.Item
            name={["addresses", 0, "line1"]}
            label="Billing Address"
          >
            <Input.TextArea rows={3} placeholder="Billing address" />
          </Form.Item>

          <Form.Item hidden name={["addresses", 0, "type"]} initialValue="Billing">
            <Input />
          </Form.Item>

          <Divider orientation="left">Line Items</Divider>

          {lineItemsError && (
            <Alert
              message={lineItemsError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            dataSource={lineItems}
            columns={lineItemsColumns}
            pagination={false}
            rowKey="id"
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Button
            type="dashed"
            onClick={onAddLineItem}
            style={{ width: "100%", marginBottom: 16 }}
            icon={<PlusOutlined />}
          >
            Add Line Item
          </Button>

          <Card style={{ marginTop: 16, background: "#fafafa" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "50%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text>Subtotal:</Text>
                  <Text>${subtotal.toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text>Tax:</Text>
                  <Text>$0.00</Text>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong>Total:</Text>
                  <Title level={4} style={{ margin: 0 }}>${total.toFixed(2)}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Form>
      </Drawer>
    );
  };

  export default InvoiceFormDrawer;