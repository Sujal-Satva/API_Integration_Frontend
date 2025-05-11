import {
    Drawer,
    Form,
    Input,
    InputNumber,
    Button,
    Switch,
    message,
    Select,
    DatePicker,
    Empty,
} from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import moment from "moment";

const { Option } = Select;
const QuickBooksForm = ({ form, product, isSold, isPurchased, isInventory, type, setType }) => {
    console.log(type, "type")
    const [sold, setSold] = useState(isSold);
    const [purchased, setPurchased] = useState(isPurchased);
    const [inventory, setInventory] = useState(isInventory);
    const [disableInventory, setDisableInventory] = useState(false);

    useEffect(() => {
        const isInventoryType = type === "Inventory";
        setDisableInventory(isInventoryType);
        setInventory(isInventoryType);

        form.setFieldsValue({
            isTrackedAsInventory: isInventoryType,
        });
    }, [type, form]);

    return (
        <>
            <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter product name" }]}
            >
                <Input />
            </Form.Item>

            <Form.Item name="description" label="Description">
                <Input.TextArea />
            </Form.Item>

            <Form.Item
                name="type"
                label="Product Type"
                initialValue={type}
                rules={[{ required: true, message: "Please select a type" }]}
            >
                <Select value={type} onChange={setType}>
                    <Option value="Inventory">Inventory</Option>
                    <Option value="Service">Service</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="isSold"
                label="Is Sold"
                valuePropName="checked"
                initialValue={sold}
            >
                <Switch checked={sold} onChange={setSold} />
            </Form.Item>

            {sold && (
                <Form.Item
                    name="salesUnitPrice"
                    label="Sales Unit Price"
                    rules={[{ required: true, message: "Sales Unit Price is required" }]}
                >
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
            )}

            <Form.Item
                name="isPurchased"
                label="Is Purchased"
                valuePropName="checked"
                initialValue={purchased}
            >
                <Switch checked={purchased} onChange={setPurchased} />
            </Form.Item>

            {purchased && (
                <Form.Item
                    name="purchaseUnitPrice"
                    label="Purchase Unit Price"
                    rules={[{ required: true, message: "Purchase Unit Price is required" }]}
                >
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
            )}

            <Form.Item
                name="isTrackedAsInventory"
                label="Tracked as Inventory"
                valuePropName="checked"
                initialValue={inventory}
            >
                <Switch checked={inventory} onChange={setInventory} disabled={disableInventory} />
            </Form.Item>

            {type === "Inventory" && (
                <>
                    <Form.Item
                        name="qtyOnHand"
                        label="Quantity on Hand"
                        initialValue={product?.quantityOnHand || 0}
                        rules={[{ required: true, message: "Quantity on Hand is required" }]}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        name="invStartDate"
                        label="Inventory Start Date"
                        initialValue={moment()}
                        rules={[{ required: true, message: "Inventory Start Date is required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </>
            )}
        </>
    );
};

const XeroForm = ({ form, product, isSold, isPurchased, isInventory }) => {
    console.log("XeroForm product:", product, "isSold:", isSold, "isPurchased:", isPurchased, "isInventory:", isInventory, "form:", form);
    const [sold, setSold] = useState(isSold);
    const [purchased, setPurchased] = useState(isPurchased);
    const [inventory, setInventory] = useState(isInventory);
    const [isInventoryDisabled, setIsInventoryDisabled] = useState(false);

    useEffect(() => {
        const shouldEnableInventory = sold && purchased;
        setIsInventoryDisabled(shouldEnableInventory);
        setInventory(shouldEnableInventory);

        form.setFieldsValue({
            isTrackedAsInventory: shouldEnableInventory,
        });
    }, [sold, purchased, form]);
    return (
        <>
            <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: "Please enter product code" }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter product name" }]}
            >
                <Input />
            </Form.Item>

            <Form.Item name="description" label="Description">
                <Input.TextArea />
            </Form.Item>

            <Form.Item
                name="isSold"
                label="Is Sold"
                valuePropName="checked"
                initialValue={sold}
            >
                <Switch checked={sold} onChange={setSold} />
            </Form.Item>

            {sold && (
                <Form.Item
                    name="salesUnitPrice"
                    label="Sales Unit Price"
                    rules={[{ required: true, message: "Sales Unit Price is required" }]}
                >
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
            )}

            <Form.Item
                name="isPurchased"
                label="Is Purchased"
                valuePropName="checked"
                initialValue={purchased}
            >
                <Switch checked={purchased} onChange={setPurchased} />
            </Form.Item>

            {purchased && (
                <Form.Item
                    name="purchaseUnitPrice"
                    label="Purchase Unit Price"
                    rules={[{ required: true, message: "Purchase Unit Price is required" }]}
                >
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
            )}

            <Form.Item
                name="isTrackedAsInventory"
                label="Tracked as Inventory"
                valuePropName="checked"
                initialValue={inventory}
            >
                <Switch checked={inventory} onChange={setInventory} disabled={isInventoryDisabled} />
            </Form.Item>
        </>
    );
};

export const ProductDrawer = ({
    visible,
    onClose,
    onSubmit,
    product,
    form,
    loading,
}) => {
    const { connectedAccounts } = useAuth();
    const [platform, setPlatform] = useState("");
    const [isSold, setIsSold] = useState(true);
    const [isPurchased, setIsPurchased] = useState(true);
    const [isInventory, setIsInventory] = useState(false);
    const [type, setType] = useState("Service");
    const [sourceSystem, setSourceSystem] = useState("");
    useEffect(() => {

        if (product && product.sourceSystem == "Xero") {
            console.log("Product:", product);
            setSourceSystem("Xero");
            setPlatform("Xero");
            if (product.isTrackedAsInventory == false) {
                setIsSold(false);
                setIsPurchased(false);
            } else {
                setIsSold(true);
                setIsPurchased(true);
            }
            setIsInventory(product.isTrackedAsInventory ?? false);
            form.setFieldsValue({
                code: product.code,
                name: product.name,
                externalId: product.externalId,
                description: product.description,
                salesUnitPrice: product.salesUnitPrice,
                purchaseUnitPrice: product.purchaseUnitPrice,
            });
        }
        else if (product && product.sourceSystem == "QuickBooks") {
            console.log("Product:", product);
            setSourceSystem("QuickBooks");
            setPlatform("QuickBooks");
            setIsSold(product.isSold ?? true);
            setType(product.isTrackedAsInventory ? "Inventory" : "Service");
            setIsPurchased(product.isPurchased ?? true);
            setIsInventory(product.isTrackedAsInventory ?? false);
            form.setFieldsValue({
                name: product.name,
                externalId: product.externalId,
                description: product.description,
                salesUnitPrice: product.salesUnitPrice,
                purchaseUnitPrice: product.purchaseUnitPrice,
                invStartDate: product.invStartDate ? moment(product.invStartDate) : moment(),
            });
        }
        else {
            form.resetFields();
            setSourceSystem("");
            setPlatform("");
            setIsSold(true);
            setIsPurchased(true);
            setIsInventory(false);
            setType("Service");
        }
    }, [product, form]);

    // Form field change handlersś
    const handleIsSoldChange = (checked) => {
        setIsSold(checked);
    };

    const handleIsPurchasedChange = (checked) => {
        setIsPurchased(checked);
    };

    const handleIsInventoryChange = (checked) => {
        setIsInventory(checked);
    };

    const handleTypeChange = (value) => {
        setType(value);

        if (value === "Inventory") {
            form.setFieldValue("isTrackedAsInventory", true);
            setIsInventory(true);
        }
    };

    const handlePlatformChange = (selectedPlatform) => {
        setPlatform(selectedPlatform);
        if (!product) {
            form.resetFields();

            // Set default values
            form.setFieldsValue({
                isSold: true,
                isPurchased: true,
                isTrackedAsInventory: false,
                type: "Service",
            });

            setIsSold(true);
            setIsPurchased(true);
            setIsInventory(false);
            setType("NonInventory");
        }
    };

    const handleFinish = (values) => {
        if (!platform) {
            message.error("Please select a platform.");
            return;
        }

        const payload = {
            ...values,
            externalId: product ? product.externalId : undefined,
        };
        onSubmit(payload, platform);
    };

    return (
        <Drawer
            title={product ? `Edit Product (${sourceSystem})` : "Add Product"}
            placement="right"
            onClose={onClose}
            open={visible}
            width={600}
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={handleFinish}
                onValuesChange={(changedValues) => {
                    // Handle form value changes
                    if (changedValues.isSold !== undefined) handleIsSoldChange(changedValues.isSold);
                    if (changedValues.isPurchased !== undefined) handleIsPurchasedChange(changedValues.isPurchased);
                    if (changedValues.isTrackedAsInventory !== undefined) handleIsInventoryChange(changedValues.isTrackedAsInventory);
                    if (changedValues.type !== undefined) handleTypeChange(changedValues.type);
                }}
            >

                <Form.Item
                    label="Select Platform"
                    required
                    tooltip="Choose where to submit the product"
                >
                    <Select
                        placeholder="Select Platform"
                        value={platform}
                        onChange={handlePlatformChange}
                        disabled={!!product} // Disable on edit
                    >
                        {connectedAccounts.quickbooks && <Option value="QuickBooks">QuickBooks</Option>}
                        {connectedAccounts.xero && <Option value="Xero">Xero</Option>}
                    </Select>
                </Form.Item>

                {/* Render platform-specific form */}
                {platform === "QuickBooks" ? (
                    <QuickBooksForm
                        form={form}
                        product={product}
                        isSold={isSold}
                        isPurchased={isPurchased}
                        isInventory={isInventory}
                        type={type}
                        setType={handleTypeChange}
                    />
                ) : platform === "Xero" ? (
                    <XeroForm
                        form={form}
                        product={product}
                        isSold={isSold}
                        isPurchased={isPurchased}
                        isInventory={isInventory}
                    />
                ) : (
                    <></>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={!platform}
                    >
                        {product ? `Update in ${sourceSystem}` : `Add to ${platform}`}
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};