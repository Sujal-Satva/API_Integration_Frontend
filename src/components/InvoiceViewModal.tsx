
import { Modal, Descriptions, Table, Typography, Divider, Button, Space, Tag, Card } from "antd";
import moment from "moment";

const { Title, Text } = Typography;

const InvoiceViewModal = ({ visible, onClose, invoice, customers, products }) => {
  if (!invoice) return null;

  const customer = customers.find(
    (c) => String(c.id) === String(invoice.customerId) || String(c.qbId) === String(invoice.customerId)
  );

  // Line items columns
  const columns = [
    {
      title: "Item",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
    },
    {
      title: "Unit Price",
      dataIndex: "unitAmount",
      key: "unitAmount",
      align: "right",
      render: (amount) => `${invoice.currencyCode} ${amount?.toFixed(2)}`,
    },
    {
      title: "Amount",
      dataIndex: "lineAmount",
      key: "lineAmount",
      align: "right",
      render: (amount) => `${invoice.currencyCode} ${amount?.toFixed(2)}`,
    },
  ];

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      width={1000}
    >
      <div style={{ padding: "20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {customer?.name || customer?.customerName || invoice.customerName}
            </Title>
            <Text type="secondary" style={{ whiteSpace: "pre-line" }}>
              {invoice.billingAddress}
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Title level={3} style={{ margin: 0 }}>INVOICE</Title>
            <Text strong>#{invoice.invoiceNumber}</Text>
            {invoice.reference && (
              <div>
                <Text type="secondary">Reference: {invoice.reference}</Text>
              </div>
            )}
          </div>
        </div>

        <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Invoice Date">
            {moment(invoice.invoiceDate).format("MMM D, YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {moment(invoice.dueDate).format("MMM D, YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Name">{invoice.customerName}</Descriptions.Item>
          <Descriptions.Item label="Source">{invoice.sourceSystem}</Descriptions.Item>
          <Descriptions.Item label="Currency">{invoice.currencyCode}</Descriptions.Item>
          <Descriptions.Item label="Created On">
            {moment(invoice.createdAt).format("MMM D, YYYY, h:mm A")}
          </Descriptions.Item>
        </Descriptions>

        <Table
          dataSource={invoice.lineItems}
          columns={columns}
          pagination={false}
          rowKey="lineId"
          size="small"
          style={{ marginBottom: 24 }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Card style={{ width: 300 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text>Subtotal:</Text>
              <Text>{invoice.currencyCode} {invoice.subtotal?.toFixed(2)}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text>Tax:</Text>
              <Text>{invoice.currencyCode} {(invoice.taxAmount || 0).toFixed(2)}</Text>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text strong>Total:</Text>
              <Title level={4} style={{ margin: 0 }}>
                {invoice.currencyCode} {invoice.total?.toFixed(2)}
              </Title>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <Text>Amount Paid:</Text>
                  <Text>{invoice.currencyCode} {invoice.amountPaid?.toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <Text strong>Amount Due:</Text>
                  <Text strong type={invoice.amountDue > 0 ? "danger" : "success"}>
                    {invoice.currencyCode} {invoice.amountDue?.toFixed(2)}
                  </Text>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceViewModal;