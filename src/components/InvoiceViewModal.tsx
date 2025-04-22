import React from 'react';
import { Modal, Button, Row, Col, Card, Descriptions, Table, Divider, Typography, Tag } from 'antd';
import moment from 'moment';
import { Invoice, Customer, Product, LineItem } from './../interfaces';

const { Text } = Typography;

interface InvoiceViewModalProps {
  visible: boolean;
  onClose: () => void;
  selectedInvoice: Invoice | null;
  customers: Customer[];
  products: Product[];
}

const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  visible,
  onClose,
  selectedInvoice,
  customers,
  products,
}) => {
  if (!selectedInvoice) return null;

  const getCustomerInfo = (customerId: number): Customer => {
    return customers.find((c) => c.id === customerId) || { id: 0, displayName: 'Unknown Customer', email: '', line1: '' };
  };

  const getProductInfo = (productId: number): any => {
    return products.find((p) => p.qbItemId === productId.toString()) || { id: 0, qbItemId: '', name: 'Unknown Product', unitPrice: 0 };
  };

  const viewLineItemColumns = [
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: 'Product Name',
      dataIndex: 'productId',
      key: 'productName',
      render: (productId: number) =>
        getProductInfo(productId)?.name || 'Unknown Product',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `$${rate.toFixed(2)}`,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
  ];

  return (
    <Modal
      title={`Invoice Details - #${selectedInvoice.invoiceId}`}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Invoice Information">
              <Descriptions layout="vertical" column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label="Invoice ID">
                  {selectedInvoice.invoiceId}
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Date">
                  {moment(selectedInvoice.invoiceDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  {moment(selectedInvoice.dueDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="Store">
                  {selectedInvoice.store}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedInvoice.status === 'Paid' ? 'green' : 'orange'}>
                    {selectedInvoice.status || 'Pending'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Customer Information">
              {(() => {
                const customer = getCustomerInfo(selectedInvoice.customerId);
                return (
                  <Descriptions layout="vertical" column={1}>
                    <Descriptions.Item label="Customer Name">
                      {customer.displayName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedInvoice.customerEmail || customer.email || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                );
              })()}
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Billing Information">
              <Descriptions layout="vertical" column={1}>
                <Descriptions.Item label="Billing Address">
                  {selectedInvoice.billingAddress}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Line Items">
              <Table
                dataSource={selectedInvoice.lineItems}
                columns={viewLineItemColumns}
                pagination={false}
                rowKey="id"
              />
              <Divider />
              <Row justify="end">
                <Col span={8}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Subtotal:</Text> ${selectedInvoice.subtotal.toFixed(2)}
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        Total:
                      </Text>{' '}
                      <Text style={{ fontSize: 16 }}>
                        ${selectedInvoice.total.toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default InvoiceViewModal;