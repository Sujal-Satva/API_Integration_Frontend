import { Drawer, Form, Input, Button, Select, Space, FormInstance, Checkbox } from "antd";
import { useEffect } from "react";

interface VendorDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any, platform: string) => Promise<void>;
  vendor: any | null;
  form: FormInstance;
  loading: boolean;
}

export const VendorDrawer: React.FC<VendorDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  vendor,
  form,
  loading,
}) => {
  const [platformForm] = Form.useForm();

  useEffect(() => {
    if (visible && vendor) {
      form.setFieldsValue({
        displayName: vendor.displayName,
        givenName: vendor.givenName,
        familyName: vendor.familyName,
        companyName: vendor.companyName,
        emailAddress: vendor.email,
        phoneNumber: vendor.phone,
        addressLine1: vendor.addressLine1,
        city: vendor.city,
        countrySubDivisionCode: vendor.countrySubDivisionCode,
        postalCode: vendor.postalCode,
        vendor1099: vendor.vendor1099,
      });
      platformForm.setFieldsValue({
        platform: vendor.sourceSystem,
      });
    } else {
      form.resetFields();
      platformForm.resetFields();
    }
  }, [visible, vendor, form, platformForm]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { platform } = await platformForm.validateFields();
      await onSubmit(values, platform);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Drawer
      title={vendor ? "Edit Vendor" : "Add Vendor"}
      width={520}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Submit
          </Button>
        </Space>
      }
    >
      <Form
        form={platformForm}
        layout="vertical"
        initialValues={{ platform: vendor?.sourceSystem || "QuickBooks" }}
      >
        <Form.Item
          name="platform"
          label="Platform"
          rules={[{ required: true, message: "Please select a platform" }]}
        >
          <Select disabled={!!vendor}>
            <Select.Option value="QuickBooks">QuickBooks</Select.Option>
            <Select.Option value="Xero">Xero</Select.Option>
          </Select>
        </Form.Item>
      </Form>

      <Form form={form} layout="vertical">
        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[{ required: true, message: "Please enter the display name" }]}
        >
          <Input placeholder="Display Name" />
        </Form.Item>

        <Form.Item name="givenName" label="Given Name">
          <Input placeholder="Given Name" />
        </Form.Item>

        <Form.Item name="familyName" label="Family Name">
          <Input placeholder="Family Name" />
        </Form.Item>

        <Form.Item name="companyName" label="Company Name">
          <Input placeholder="Company Name" />
        </Form.Item>

        <Form.Item
          name="emailAddress"
          label="Email"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>

        <Form.Item name="phoneNumber" label="Phone">
          <Input placeholder="Phone" />
        </Form.Item>

        <Form.Item name="addressLine1" label="Address">
          <Input placeholder="Address" />
        </Form.Item>

        <Form.Item name="city" label="City">
          <Input placeholder="City" />
        </Form.Item>

        <Form.Item name="countrySubDivisionCode" label="State/Province">
          <Input placeholder="State/Province" />
        </Form.Item>

        <Form.Item name="postalCode" label="Postal Code">
          <Input placeholder="Postal Code" />
        </Form.Item>

        <Form.Item
          name="vendor1099"
          valuePropName="checked"
          label="1099 Vendor"
        >
          <Checkbox>Is 1099 Vendor</Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
};