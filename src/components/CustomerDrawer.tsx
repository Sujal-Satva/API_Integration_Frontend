import { Drawer, Form, Input, Button, message } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface CustomerDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any, platform: string) => void;
  customer: any | null;
  form: any;
  loading: boolean;
}

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  customer,
  form,
  loading,
}) => {
  const [submitPlatform, setSubmitPlatform] = useState<string>("");
  const { connectedAccounts } = useAuth();
  useEffect(() => {
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
  }, [customer, form]);
  
  const handleFinish = (values: any) => {
    if (!submitPlatform) {
      message.error("Please select a platform to submit.");
      return;
    }
    console.log(values, submitPlatform);
    onSubmit(customer ? {
      ...values, externalId: submitPlatform == "QuickBooks" ? customer.quickBooksId : customer.xeroId
    } : values, submitPlatform);
  };

  return (
    <Drawer
      title={customer ? "Edit Customer" : "Add Customer"}
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          name="displayName"
          label="Name"
          rules={[{ required: true, message: "Please enter Display name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="emailAddress" label="Email">
          <Input />
        </Form.Item>

        <Form.Item name="addressLine1" label="Address">
          <Input />
        </Form.Item>

        <Form.Item name="city" label="City">
          <Input />
        </Form.Item>

        <Form.Item name="phoneNumber" label="Phone">
          <Input />
        </Form.Item>

        <Form.Item name="postalCode" label="Postal Code">
          <Input />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {!customer && (
            <>
              {connectedAccounts?.quickbooks && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  onClick={() => setSubmitPlatform("QuickBooks")}
                >
                  Add to QuickBooks
                </Button>
              )}
              {connectedAccounts?.xero && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  onClick={() => setSubmitPlatform("Xero")}
                >
                  Add to Xero
                </Button>
              )}
            </>
          )}

          {customer?.sourceSystem === "QuickBooks" && (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={() => setSubmitPlatform("QuickBooks")}
            >
              Update in QuickBooks
            </Button>
          )}

          {customer?.sourceSystem === "Xero" && (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={() => setSubmitPlatform("Xero")}
            >
              Update in Xero
            </Button>
          )}

        </div>


      </Form>
    </Drawer>
  );
};
