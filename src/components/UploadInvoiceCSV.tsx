import Papa from "papaparse";
import React, { useRef, useState } from "react";
import { CSVError, InvoiceRow } from "../interfaces";
import { Button, message, Modal, Table, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
const API_URL = import.meta.env.VITE_API_URL;
export const UploadInvoiceCSV = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleCSVUpload = (file: File) => {
    Papa.parse<InvoiceRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        const validationErrors = validateCSVRows(data);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setIsModalVisible(true);
        } else {
          setErrors([]);
          setIsModalVisible(false);
          message.loading("File Uploading...");
          const formData = new FormData();
          formData.append("file", file);
          try {
            const token = localStorage.getItem("qb_access_token");
            const realmId = localStorage.getItem("qb_realm_id");
            const response = await fetch(
              `${API_URL}/api/Invoice/upload-csv?realmId=${realmId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );
            const result = await response.json();
            if (response.ok) {
              message.success("CSV uploaded and processed successfully!");
              console.log("Server response:", result);
            } else {
              message.error("CSV upload failed.");
              console.error("Server error:", result);
            }
          } catch (error) {
            console.error("Upload failed:", error);
            message.error("Failed to upload CSV file.");
          }
        }
      },

      error: (err) => {
        message.info("CSV Parse Error");
        console.error("CSV Parse Error:", err);
      },
    });

    return false;
  };

  const [errors, setErrors] = useState<CSVError[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const validateCSVRows = (rows: InvoiceRow[]): CSVError[] => {
    const errors: CSVError[] = [];

    const invoicesGrouped = rows.reduce<Record<string, InvoiceRow[]>>(
      (acc, row) => {
        if (!row.InvoiceNumber) return acc;
        acc[row.InvoiceNumber] = acc[row.InvoiceNumber] || [];
        acc[row.InvoiceNumber].push(row);
        return acc;
      },
      {}
    );

    for (const [invoiceNumber, group] of Object.entries(invoicesGrouped)) {
      const first = group[0];
      const itemNames = new Set<string>();
      group.forEach((row) => {
        const rowNum = rows.indexOf(row) + 2;
        if (!row.CustomerName) {
          errors.push({ row: rowNum, message: "CustomerName is required." });
        }

        if (
          row.CustomerEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.CustomerEmail)
        ) {
          errors.push({ row: rowNum, message: "Invalid email format." });
        }

        if (isNaN(Date.parse(row.InvoiceDate))) {
          errors.push({ row: rowNum, message: "Invalid InvoiceDate." });
        }

        if (isNaN(Date.parse(row.DueDate))) {
          errors.push({ row: rowNum, message: "Invalid DueDate." });
        }

        if (!row.ItemName) {
          errors.push({ row: rowNum, message: "ItemName is required." });
        }

        if (!row.ItemDescription) {
          errors.push({ row: rowNum, message: "ItemDescription is required." });
        }

        if (
          !row.Quantity ||
          isNaN(Number(row.Quantity)) ||
          Number(row.Quantity) <= 0
        ) {
          errors.push({
            row: rowNum,
            message: "Quantity must be a positive number.",
          });
        }

        if (!row.Rate || isNaN(Number(row.Rate)) || Number(row.Rate) < 0) {
          errors.push({
            row: rowNum,
            message: "Rate must be a non-negative number.",
          });
        }
        if (
          row.CustomerName !== first.CustomerName ||
          row.CustomerEmail !== first.CustomerEmail ||
          row.InvoiceDate !== first.InvoiceDate ||
          row.DueDate !== first.DueDate
        ) {
          errors.push({
            row: rowNum,
            message:
              "Inconsistent invoice header fields within the same InvoiceNumber group.",
          });
        }

        const itemKey = row.ItemName?.trim().toLowerCase();
        if (itemKey) {
          if (itemNames.has(itemKey)) {
            errors.push({
              row: rowNum,
              message: `Duplicate ItemName "${row.ItemName}" in Invoice ${invoiceNumber}.`,
            });
          } else {
            itemNames.add(itemKey);
          }
        }
      });
    }

    return errors;
  };

  const columns = [
    { title: "Row", dataIndex: "row", key: "row" },
    { title: "Error Message", dataIndex: "message", key: "message" },
  ];

  return (
    <>
      <Upload
        accept=".csv"
        beforeUpload={handleCSVUpload}
        showUploadList={false}
      >
        <Button
          icon={<UploadOutlined />}
          type="primary"
          style={{ marginLeft: 8 }}
        >
          Upload CSV
        </Button>
      </Upload>

      <Modal
        title="CSV Validation Errors"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Table
          columns={columns}
          dataSource={errors}
          rowKey={(_, index) => index.toString()}
          pagination={false}
          size="small"
        />
      </Modal>
      <input
        type="file"
        accept=".csv" // Allow only .csv files
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCSVUpload(file);
        }}
        style={{ display: "none" }}
      />
    </>
  );
};
