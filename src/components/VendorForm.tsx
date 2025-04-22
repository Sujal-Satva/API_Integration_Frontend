// components/VendorForm.tsx
import React from "react";
import { Form, Input, InputNumber, Button } from "antd";
import { Vendor, VendorFormValues } from "../interfaces";

interface VendorFormProps {
  vendor?: Vendor;
  onFinish: (values: VendorFormValues) => Promise<void>;
  loading: boolean;
}

const VendorForm: React.FC<VendorFormProps> = ({ vendor, onFinish, loading }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (vendor) {
      form.setFieldsValue(vendor);
    } else {
      form.resetFields();
    }
  }, [vendor, form]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="displayName"
        label="Display Name"
        rules={[{ required: true, message: "Display Name is required" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="givenName" label="Given Name">
        <Input />
      </Form.Item>
      <Form.Item name="familyName" label="Family Name">
        <Input />
      </Form.Item>
      <Form.Item name="companyName" label="Company Name">
        <Input />
      </Form.Item>
      <Form.Item
        name="balance"
        label="Balance"
        rules={[{ required: true, message: "Balance is required" }]}
      >
        <InputNumber
          style={{ width: "100%" }}
          disabled={!!vendor}
          min={0}
        />
      </Form.Item>

      <Form.Item name="billAddrLine1" label="Address Line 1">
        <Input />
      </Form.Item>
      <Form.Item name="billAddrCity" label="City">
        <Input />
      </Form.Item>
      <Form.Item name="billAddrPostalCode" label="Postal Code">
        <Input />
      </Form.Item>
      <Form.Item name="primaryPhone" label="Phone">
        <Input />
      </Form.Item>
      <Form.Item
        name="primaryEmailAddr"
        label="Email"
        rules={[{ type: "email", message: "Please enter a valid email" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="webAddr" label="Website">
        <Input />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          {vendor ? "Update Vendor" : "Add Vendor"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default VendorForm;