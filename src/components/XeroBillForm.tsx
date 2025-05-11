import { Alert, Card, Divider, Drawer, Form, Input, message, Select, Table, Typography, DatePicker, Row, Col } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { Button } from "antd";
import moment from "moment";
import { billService } from "../services/billService";

const { Option } = Select;
const { Title, Text } = Typography;
interface Customer {
    externalId: string;
    displayName?: string;
    customerName?: string;
    name?: string;
    addressLine1?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    emailAddress?: string;
}

interface Product {
    externalId: string;
    description: string;
    salesUnitPrice: number;
    isActive: boolean;
    code?: string;
}

interface LineItem {
    id: string;
    productId?: string;
    description: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    accountCode?: string;
}

interface InvoiceTotal {
    subtotal: number;
    total: number;
}

const XeroBillForm = ({ visible, onClose,fetchData }) => {
    const [form] = Form.useForm();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [lineItemsError, setLineItemsError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const calculateInvoiceTotal = (items: LineItem[]): InvoiceTotal => {
        const subtotal = items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.rate || 0)), 0);
        return { subtotal, total: subtotal };
    };
    
    useEffect(() => {
        const { subtotal, total } = calculateInvoiceTotal(lineItems);
        setSubtotal(subtotal);
        setTotal(total);
    }, [lineItems]);

    const validateLineItems = (): boolean => {
        if (lineItems.length === 0) {
            setLineItemsError("Please add at least one item to the invoice");
            return false;
        }

        const invalidItems = lineItems.filter(
            item => !item.productId || (item.quantity !== undefined && item.quantity < 0)
        );

        if (invalidItems.length > 0) {
            setLineItemsError("All line items must have a product and valid quantity");
            return false;
        }

        setLineItemsError("");
        return true;
    };
    const onFinish = (values) => {
        handleSubmitInvoice(values);
    };

    const handleSubmitInvoice = async (values: any) => {
        if (!validateLineItems()) {
            return;
        }

        setLoading(true);
        try {
            const { subtotal, total } = calculateInvoiceTotal(lineItems);
            const invoiceData = {
                invoiceNumber: values.invoiceNumber,
                reference: values.reference,
                status: values.status,
                currencyCode: values.currencyCode,
                invoiceDate: values.invoiceDate.format("YYYY-MM-DD"),
                dueDate: values.dueDate.format("YYYY-MM-DD"),
                customerId: values.customerId,
                customerName: values.customerName,
                addresses: values.addresses || [{
                    line1: values.billingAddress || "",
                    line2: "",
                    city: "",
                    region: "",
                    postalCode: "",
                    country: "",
                    type: "Billing"
                }],
                lineItems: lineItems.map(item => {
                    const productId = item.productId;
                    return {
                        productId,
                        description: item.description,
                        quantity: item.quantity,
                        rate: item.rate,
                        unitAmount: item.rate,
                        taxAmount: 0,
                        lineTotal: item.amount,
                        accountCode: item.accountCode
                    };
                }),
                subtotal: subtotal,
                taxAmount: 0,
                totalAmount: total,
                amountDue: total,
                amountPaid: 0,
                lineAmountTypes: "Exclusive",
                updatedAt: new Date().toISOString(),
                sourceSystem: values.sourceSystem || "QuickBooks"
            };
            console.log("Invoice Data", invoiceData);
            await billService.saveBill(invoiceData, "xero");
            fetchData();
            onClose();
        } catch (error: any) {
            console.error("Error saving invoice:", error);
            if (error.response?.data?.error) {
                try {
                    const errorObj = JSON.parse(error.response.data.error);
                    if (errorObj?.Fault?.Error?.[0]?.Detail) {
                        message.error(errorObj.Fault.Error[0].Detail);
                    } else {
                        message.error("An error occurred while saving the invoice");
                    }
                } catch (e) {
                    message.error("An error occurred while saving the invoice");
                }
            } else {
                message.error("An error occurred while saving the invoice");
            }
        } finally {
            setLoading(false);
        }
    };

    const onAddLineItem = () => {
        handleAddLineItem();
    };

    const handleAddLineItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            productId: undefined,
            description: "",
            quantity: 1,
            rate: 0,
            amount: 0,
        };
        setLineItems([...lineItems, newItem]);
        setLineItemsError("");
    };

    const handleRemoveLineItem = (index: number) => {
        const updated = [...lineItems];
        updated.splice(index, 1);
        setLineItems(updated);
    };

    const handleUpdateLineItem = (index: number, field: string, value: any) => {
        const updated = [...lineItems];
        if (!updated[index]) {
            updated[index] = {} as LineItem;
        }
        updated[index] = { ...updated[index], [field]: value };

        if (field === "productId") {
            const product = products.find(p => p.externalId === value);
            if (product) {
                updated[index].description = product.description;
                updated[index].rate = product.salesUnitPrice;
                updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
                updated[index].productId = product.code;
            }
        }
        if (field === "quantity" || field === "rate") {
            updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
        }

        setLineItems(updated);
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.externalId === customerId);

        if (customer) {
            form.setFieldsValue({
                customerName: customer.displayName || customer.customerName,
                addresses: [{
                    line1: customer.addressLine1,
                    city: customer.city || "",
                    region: customer.region || "",
                    postalCode: customer.postalCode || "",
                    country: customer.country || "",
                    type: "Billing"
                }],
                customerEmail: customer.emailAddress
            });
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await customerService.getAllCustomer(
                1, 10, "", "displayName", "asc", "xero", true, false
            );

            setCustomers(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            message.error("Failed to load customers");
        }
    };

    const loadProducts = async () => {
        try {
            const response = await productService.getAllProducts(1, 10, "", "displayName", "asc", "xero", true, "all", false);
            setProducts(response.data.data.filter((item) => item.isActive) || []);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            message.error("Failed to load products");
        }
    };

    useEffect(() => {
        if (visible) {
            loadCustomers();
            loadProducts();
        }
    }, [visible]);

    // Define line items columns for the table
    const lineItemsColumns = [
        {
            title: "Product",
            dataIndex: "productId",
            key: "productId",
            render: (text, record, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select product"
                    value={text}
                    onChange={(value) => handleUpdateLineItem(index, "productId", value)}
                >
                    {products.map((product) => (
                        <Option key={product.externalId} value={product.externalId}>
                            {product.description}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text, record, index) => (
                <Input
                    value={text}
                    onChange={(e) => handleUpdateLineItem(index, "description", e.target.value)}
                />
            ),
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            width: 100,
            render: (text, record, index) => (
                <Input
                    type="number"
                    min={0}
                    value={text}
                    onChange={(e) => handleUpdateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                />
            ),
        },
        {
            title: "Rate",
            dataIndex: "rate",
            key: "rate",
            width: 100,
            render: (text, record, index) => (
                <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={text}
                    onChange={(e) => handleUpdateLineItem(index, "rate", parseFloat(e.target.value) || 0)}
                />
            ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 100,
            render: (text) => `$${(text || 0).toFixed(2)}`,
        },
        {
            title: "Action",
            key: "action",
            width: 80,
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    onClick={() => handleRemoveLineItem(index)}
                >
                    Delete
                </Button>
            ),
        },
    ];

    return (
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
            preserve={true}
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
                <Col span={12}>
                    <Form.Item
                        name="currencyCode"
                        label="Currency"
                        rules={[{ required: true, message: "Please select currency" }]}
                    >
                        <Select placeholder="Select currency">
                            <Option value="USD">USD - US Dollar</Option>
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
                    {customers.map((customer) => (
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

            <div style={{ display: "flex", marginTop: "10px", justifyContent: "flex-end" }}>
                <Button onClick={onClose} style={{ marginRight: 8 }}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={() => form.submit()}
                    loading={loading}
                    icon={<SaveOutlined />}
                >
                    {"Create Bill"}
                </Button>
            </div>
        </Form>
        // </Drawer>
    );
};

export default XeroBillForm;