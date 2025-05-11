// src/components/UploadInvoiceModal.jsx
import React, { useState } from "react";
import { Modal, Upload, Button, message, Alert, Select, Form, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { invoiceService } from "../services/invoiceService";

const { Option } = Select;
const { Dragger } = Upload;

const UploadInvoiceModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [importType, setImportType] = useState("csv");

  const handleUpload = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("file", file);
    });
    formData.append("sourceSystem", form.getFieldValue("sourceSystem"));

    setUploading(true);
    try {
      await invoiceService.uploadInvoices(formData);
      message.success("Invoices successfully imported");
      setFileList([]);
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error("Upload failed:", error);
      message.error("Failed to import invoices. Please check file format and try again.");
    } finally {
      setUploading(false);
    }
  };

  const props = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Check file type based on importType
      const isCSV = file.type === "text/csv";
      const isExcel = 
        file.type === "application/vnd.ms-excel" || 
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      
      if (importType === "csv" && !isCSV) {
        message.error("You can only upload CSV files!");
        return Upload.LIST_IGNORE;
      }
      
      if (importType === "excel" && !isExcel) {
        message.error("You can only upload Excel files!");
        return Upload.LIST_IGNORE;
      }
      
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <Modal
      title="Import Invoices"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0}
          loading={uploading}
        >
          {uploading ? "Importing..." : "Import"}
        </Button>,
      ]}
    >
      <Alert
        message="Import Instructions"
        description={
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Make sure your file has the required headers and format</li>
            <li>For CSV: columns should include invoice number, date, customer info, and line items</li>
            <li>For Excel: use the template format with proper sheet names</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Form.Item
            name="importType"
            label="Import Type"
            initialValue="csv"
            style={{ width: "48%" }}
          >
            <Select onChange={(value) => setImportType(value)}>
              <Option value="csv">CSV Import</Option>
              <Option value="excel">Excel Import</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="sourceSystem"
            label="Source System"
            initialValue="QuickBooks"
            rules={[{ required: true, message: "Please select a source system" }]}
            style={{ width: "48%" }}
          >
            <Select>
              <Option value="QuickBooks">QuickBooks</Option>
              <Option value="Xero">Xero</Option>
            </Select>
          </Form.Item>
        </Space>
      </Form>

      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for single {importType === "csv" ? "CSV" : "Excel"} file upload.
        </p>
      </Dragger>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
        <Button>
          <a href="/templates/invoice-import-template.xlsx" download>
            Download Template
          </a>
        </Button>
        <Button type="link" onClick={() => window.open("/docs/invoice-import-guide.pdf")}>
          View Import Guide
        </Button>
      </div>
    </Modal>
  );
};

export default UploadInvoiceModal;