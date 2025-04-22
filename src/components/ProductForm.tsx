// src/components/ProductForm.tsx
import React, { useEffect, useState } from "react";
import { Form, Input, Select, Switch, Spin, message } from "antd";
import { Product, ProductFormValues, AccountOption } from "../interfaces";
import { getAccounts } from "../services/productService";

const { Option } = Select;

interface ProductFormProps {
  initialValues?: Product | null;
  form: any;
  isEditMode: boolean;
  handleFormSubmit: (values: ProductFormValues) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  form,
  isEditMode,
  handleFormSubmit,
}) => {
  const [incomeAccounts, setIncomeAccounts] = useState<AccountOption[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<AccountOption[]>([]);
  const [inventoryAssetAccounts, setInventoryAssetAccounts] = useState<
    AccountOption[]
  >([]);
  const [fetchingAccounts, setFetchingAccounts] = useState<boolean>(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (initialValues && !fetchingAccounts && incomeAccounts.length > 0) {
      // Setup form values
      const formValues: ProductFormValues = {
        ...initialValues,
        type: initialValues.type || "Service",
        incomeAccountValue: initialValues.incomeAccountValue,
      };
      const validIncomeAccount = incomeAccounts.find(
        (acc) => acc.id === initialValues.incomeAccountValue
      );
      if (!validIncomeAccount && incomeAccounts.length > 0) {
        message.warning(
          "Selected income account is not valid for this product"
        );
      }
      if (
        initialValues.type === "Inventory" &&
        initialValues.expenseAccountValue
      ) {
        formValues.expenseAccountValue = initialValues.expenseAccountValue;
        const validExpenseAccount = expenseAccounts.find(
          (acc) => acc.id === initialValues.expenseAccountValue
        );
        if (!validExpenseAccount && expenseAccounts.length > 0) {
          message.warning(
            "Selected expense account is not valid for this product"
          );
        }
      }

      form.setFieldsValue(formValues);
    }
  }, [initialValues, fetchingAccounts, incomeAccounts, expenseAccounts, form]);

  const fetchAccounts = async () => {
    setFetchingAccounts(true);
    try {
      const accounts = await getAccounts();
      setIncomeAccounts(accounts.incomeAccounts);
      setExpenseAccounts(accounts.expenseAccounts);
      setInventoryAssetAccounts(accounts.inventoryAssetAccounts);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      message.error("Failed to fetch accounts from QuickBooks");
    } finally {
      setFetchingAccounts(false);
    }
  };

  if (fetchingAccounts) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <p>Loading account information...</p>
      </div>
    );
  }

  return (
    <Form
      onFinish={handleFormSubmit}
      autoComplete="off"
      name="productForm"
      id="productForm"
      form={form}
      layout="vertical"
      initialValues={initialValues || { taxable: false, type: "Service" }}
    >
      <Form.Item
        label="Product Name"
        name="name"
        rules={[{ required: true, message: "Please input the product name!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Type"
        name="type"
        rules={[{ required: true, message: "Please select the product type!" }]}
      >
        <Select>
          <Option value="Service">Service</Option>
          <Option value="Inventory">Inventory</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Unit Price"
        name="unitPrice"
        rules={[{ required: true, message: "Please input the unit price!" }]}
      >
        <Input type="number" prefix="$" step="0.01" />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item
        label="Income Account"
        name="incomeAccountName"
        rules={[
          { required: true, message: "Please select an income account!" },
        ]}
      >
        <Select placeholder="Select income account" loading={fetchingAccounts}>
          {incomeAccounts.map((account) => (
            <Option key={account.id} value={account.name}>
              {account.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.type !== currentValues.type
        }
      >
        {({ getFieldValue }) =>
          getFieldValue("type") === "Inventory" ? (
            <Form.Item
              label="Expense Account"
              name="expenseAccountName"
              rules={[
                {
                  required: true,
                  message:
                    "Please select an expense account for inventory items!",
                },
              ]}
            >
              <Select
                placeholder="Select expense account"
                loading={fetchingAccounts}
              >
                {expenseAccounts.map((account) => (
                  <Option key={account.id} value={account.name}>
                    {account.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : null
        }
      </Form.Item>

      <Form.Item label="Taxable" name="taxable" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="fullyQualifiedName" hidden>
        <Input />
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
