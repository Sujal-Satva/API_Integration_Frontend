import { Alert, Card, Divider, Form, Input, message, Select, Table, Typography, DatePicker, Row, Col, Tabs } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
// import { vendorService } from "../services/vendorService";
import { productService } from "../services/productService";
import { accountService } from "../services/accountService";
import { customerService } from "../services/customerService";
import { Button } from "antd";
import moment from "moment";
import { billService } from "../services/billService";
import { vendorService } from "../services/vendorService";

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Vendor {
    externalId: string;
    displayName?: string;
    vendorName?: string;
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

interface Account {
    externalId: string;
    name: string;
    accountType: string;
    isActive: boolean;
}

interface Customer {
    externalId: string;
    displayName?: string;
    customerName?: string;
    name?: string;
}

interface CategoryLineItem {
    id: string;
    accountId?: string;
    description: string;
    amount?: number;
    customerId?: string;
    type: 'category';
}

interface ItemLineItem {
    id: string;
    itemId?: string;
    description: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    customerId?: string;
    type: 'item';
}

type LineItem = CategoryLineItem | ItemLineItem;

interface BillTotal {
    subtotal: number;
    total: number;
}

const QuickBooksBillForm = ({ visible, onClose, fetchData }) => {
    const [form] = Form.useForm();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [categoryLineItems, setCategoryLineItems] = useState<CategoryLineItem[]>([]);
    const [itemLineItems, setItemLineItems] = useState<ItemLineItem[]>([]);
    const [lineItemsError, setLineItemsError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("category");
    const [subtotal, setSubtotal] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    const calculateBillTotal = (categoryItems: CategoryLineItem[], itemItems: ItemLineItem[]): BillTotal => {
        const categoryTotal = categoryItems.reduce((acc, item) => acc + (item.amount || 0), 0);
        const itemTotal = itemItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.rate || 0)), 0);
        const subtotal = categoryTotal + itemTotal;
        return { subtotal, total: subtotal };
    };

    useEffect(() => {
        const { subtotal, total } = calculateBillTotal(categoryLineItems, itemLineItems);
        setSubtotal(subtotal);
        setTotal(total);
    }, [categoryLineItems, itemLineItems]);

    const validateLineItems = (): boolean => {
        if (categoryLineItems.length === 0 && itemLineItems.length === 0) {
            setLineItemsError("Please add at least one line item to the bill");
            return false;
        }

        const invalidCategoryItems = categoryLineItems.filter(
            item => !item.accountId || !item.amount || item.amount <= 0
        );

        const invalidItemItems = itemLineItems.filter(
            item => !item.itemId || (item.quantity !== undefined && item.quantity <= 0)
        );

        if (invalidCategoryItems.length > 0 || invalidItemItems.length > 0) {
            setLineItemsError("All line items must have required fields filled with valid values");
            return false;
        }

        setLineItemsError("");
        return true;
    };

    const onFinish = (values) => {
        handleSubmitBill(values);
    };

    const handleSubmitBill = async (values: any) => {
        if (!validateLineItems()) {
            return;
        }

        setLoading(true);
        try {
            // const { subtotal, total } = calculateBillTotal(categoryLineItems, itemLineItems)
            const Line = [
                ...categoryLineItems.map(item => ({
                    DetailType: "AccountBasedExpenseLineDetail",
                    Amount: item.amount,
                    AccountBasedExpenseLineDetail: {
                        AccountRef: { value: item.accountId },
                        CustomerRef: item.customerId ? { value: item.customerId } : undefined
                    }
                })),
                ...itemLineItems.map(item => ({
                    DetailType: "ItemBasedExpenseLineDetail",
                    Amount: item.amount,
                    ItemBasedExpenseLineDetail: {
                        BillableStatus: "NotBillable", // or "Billable" if you support it
                        ItemRef: { value: item.itemId },
                        UnitPrice: item.rate,
                        Qty: item.quantity,
                        TaxCodeRef: { value: "TAX" }, // Replace "TAX" with actual value if dynamic
                        CustomerRef: item.customerId ? { value: item.customerId } : undefined
                    }
                }))
            ];

            const billPayload = {
                Line,
                TxnDate: values.billDate.format("YYYY-MM-DD"),
                DueDate: values.dueDate.format("YYYY-MM-DD"),
                VendorRef: {
                    value: values.vendorId,
                },
                APAccountRef: {
                    value: "33"
                },
                CurrencyRef: values.currencyCode
                    ? { value: values.currencyCode }
                    : undefined
            };
            await billService.saveBill(billPayload, "quickbooks");
            fetchData();
            onClose();

        } catch (error: any) {
            console.error("Error saving bill:", error);
            if (error.response?.data?.error) {
                try {
                    const errorObj = JSON.parse(error.response.data.error);
                    if (errorObj?.Fault?.Error?.[0]?.Detail) {
                        message.error(errorObj.Fault.Error[0].Detail);
                    } else {
                        message.error("An error occurred while saving the bill");
                    }
                } catch (e) {
                    message.error("An error occurred while saving the bill");
                }
            } else {
                message.error("An error occurred while saving the bill");
            }
        } finally {
            setLoading(false);
        }
    };


    const handleAddCategoryLineItem = () => {
        const newItem: CategoryLineItem = {
            id: Date.now().toString(),
            accountId: undefined,
            description: "",
            amount: 0,
            customerId: undefined,
            type: 'category'
        };
        setCategoryLineItems([...categoryLineItems, newItem]);
        setLineItemsError("");
    };

    const handleAddItemLineItem = () => {
        const newItem: ItemLineItem = {
            id: Date.now().toString(),
            itemId: undefined,
            description: "",
            quantity: 1,
            rate: 0,
            amount: 0,
            customerId: undefined,
            type: 'item'
        };
        setItemLineItems([...itemLineItems, newItem]);
        setLineItemsError("");
    };

    const handleRemoveCategoryLineItem = (index: number) => {
        const updated = [...categoryLineItems];
        updated.splice(index, 1);
        setCategoryLineItems(updated);
    };

    const handleRemoveItemLineItem = (index: number) => {
        const updated = [...itemLineItems];
        updated.splice(index, 1);
        setItemLineItems(updated);
    };

    const handleUpdateCategoryLineItem = (index: number, field: string, value: any) => {
        const updated = [...categoryLineItems];
        if (!updated[index]) {
            updated[index] = { id: Date.now().toString(), type: 'category' } as CategoryLineItem;
        }
        updated[index] = { ...updated[index], [field]: value };

        if (field === "accountId") {
            const account = accounts.find(a => a.externalId === value);
            if (account) {
                updated[index].description = account.name;
            }
        }

        setCategoryLineItems(updated);
    };

    const handleUpdateItemLineItem = (index: number, field: string, value: any) => {
        const updated = [...itemLineItems];
        if (!updated[index]) {
            updated[index] = { id: Date.now().toString(), type: 'item' } as ItemLineItem;
        }
        updated[index] = { ...updated[index], [field]: value };

        if (field === "itemId") {
            const product = products.find(p => p.externalId === value);
            if (product) {
                updated[index].description = product.description;
                updated[index].rate = product.salesUnitPrice;
                updated[index].amount = (updated[index].quantity || 0) * (product.salesUnitPrice || 0);
            }
        }

        if (field === "quantity" || field === "rate") {
            updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
        }

        setItemLineItems(updated);
    };

    const handleVendorChange = (vendorId: string) => {
        const vendor = vendors.find(v => v.externalId === vendorId);
        console.log(vendor);
        if (vendor) {
            form.setFieldsValue({
                vendorName: vendor.displayName || vendor.vendorName || vendor.name,
                vendorEmail: vendor.email
            });
        }
    };

    const loadVendors = async () => {
        try {
            const response = await vendorService.getAllVendors(
                1, 10, "", "displayName", "asc", "quickbooks", true, false
            );
            setVendors(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            message.error("Failed to load vendors");
        }
    };

    const loadProducts = async () => {
        try {
            const response = await productService.getAllProducts(
                1, 10, "", "displayName", "asc", "quickbooks", true, "all", false
            );
            setProducts(response.data.data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            message.error("Failed to load products");
        }
    };

    const loadAccounts = async () => {
        try {
            const response = await accountService.getAllAccounts(
                1, 10, "", "name", "asc", false, "quickbooks",
            );
            setAccounts(response.data.data);
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            message.error("Failed to load accounts");
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await customerService.getAllCustomer(
                1, 10, "", "displayName", "asc", "quickbooks", true, false
            );
            console.log("Customers", response.data.data);
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            message.error("Failed to load customers");
        }
    };

    useEffect(() => {
        if (visible) {
            loadVendors();
            loadProducts();
            loadAccounts();
            loadCustomers();
        }
    }, [visible]);

    // Define category line items columns for the table
    const categoryLineItemsColumns = [
        {
            title: "Account",
            dataIndex: "accountId",
            key: "accountId",
            render: (text, record, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select account"
                    value={text}
                    onChange={(value) => handleUpdateCategoryLineItem(index, "accountId", value)}
                >
                    {accounts.map((account) => (
                        <Option key={account.externalId} value={account.externalId}>
                            {account.name}
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
                    onChange={(e) => handleUpdateCategoryLineItem(index, "description", e.target.value)}
                />
            ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 100,
            render: (text, record, index) => (
                <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={text}
                    onChange={(e) => handleUpdateCategoryLineItem(index, "amount", parseFloat(e.target.value) || 0)}
                />
            ),
        },
        {
            title: "Customer",
            dataIndex: "customerId",
            key: "customerId",
            render: (text, record, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select customer"
                    value={text}
                    onChange={(value) => handleUpdateCategoryLineItem(index, "customerId", value)}
                >
                    {customers.map((customer) => (
                        <Option key={customer.externalId} value={customer.externalId}>
                            {customer.displayName || customer.customerName || customer.name || "Unknown Customer"}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 80,
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    onClick={() => handleRemoveCategoryLineItem(index)}
                >
                    Delete
                </Button>
            ),
        },
    ];

    // Define item line items columns for the table
    const itemLineItemsColumns = [
        {
            title: "Item",
            dataIndex: "itemId",
            key: "itemId",
            render: (text, record, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select item"
                    value={text}
                    onChange={(value) => handleUpdateItemLineItem(index, "itemId", value)}
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
                    onChange={(e) => handleUpdateItemLineItem(index, "description", e.target.value)}
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
                    onChange={(e) => handleUpdateItemLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => handleUpdateItemLineItem(index, "rate", parseFloat(e.target.value) || 0)}
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
            title: "Customer",
            dataIndex: "customerId",
            key: "customerId",
            render: (text, record, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select customer"
                    value={text}
                    onChange={(value) => handleUpdateItemLineItem(index, "customerId", value)}
                >
                    {customers.map((customer) => (
                        <Option key={customer.externalId} value={customer.externalId}>
                            {customer.displayName || customer.customerName || customer.name || "Unknown Customer"}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 80,
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    onClick={() => handleRemoveItemLineItem(index)}
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
                billDate: moment(),
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
                        name="billDate"
                        label="Bill Date"
                        rules={[{ required: true, message: "Please select bill date" }]}
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

            <Row>
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

            <Divider orientation="left">Vendor Information</Divider>

            <Form.Item
                name="vendorId"
                label="Vendor"
                rules={[{ required: true, message: "Please select a vendor" }]}
            >
                <Select
                    placeholder="Select vendor"
                    onChange={handleVendorChange}
                    showSearch
                    optionFilterProp="children"
                >
                    {vendors.map((vendor) => (
                        <Option key={vendor.externalId} value={vendor.externalId}>
                            {vendor.displayName || vendor.vendorName || vendor.name || "Unknown Vendor"}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="vendorName"
                label="Vendor Name"
                rules={[{ required: true, message: "Please enter vendor name" }]}
            >
                <Input placeholder="Vendor name" />
            </Form.Item>

            <Form.Item
                name="vendorEmail"
                label="Vendor Email"
            >
                <Input placeholder="Vendor email" />
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

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
            >
                <TabPane tab="Category" key="category">
                    <Table
                        dataSource={categoryLineItems}
                        columns={categoryLineItemsColumns}
                        pagination={false}
                        rowKey="id"
                        size="small"
                        style={{ marginBottom: 16 }}
                    />
                    <Button
                        type="dashed"
                        onClick={handleAddCategoryLineItem}
                        style={{ width: "100%", marginBottom: 16 }}
                        icon={<PlusOutlined />}
                    >
                        Add Category Line Item
                    </Button>
                </TabPane>
                <TabPane tab="Item" key="item">
                    <Table
                        dataSource={itemLineItems}
                        columns={itemLineItemsColumns}
                        pagination={false}
                        rowKey="id"
                        size="small"
                        style={{ marginBottom: 16 }}
                    />
                    <Button
                        type="dashed"
                        onClick={handleAddItemLineItem}
                        style={{ width: "100%", marginBottom: 16 }}
                        icon={<PlusOutlined />}
                    >
                        Add Item Line Item
                    </Button>
                </TabPane>
            </Tabs>

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
                    Create Bill
                </Button>
            </div>
        </Form>
    );
};

export default QuickBooksBillForm;