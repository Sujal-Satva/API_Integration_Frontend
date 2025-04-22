import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Invoice, Customer, PaginationParams } from './../interfaces';

interface InvoiceTableProps {
  invoiceData: Invoice[];
  customers: Customer[];
  loading: boolean;
  pagination: PaginationParams;
  handleTableChange: (pagination: any, filters: any, sorter: any) => void;
  openViewModal: (record: Invoice) => void;
  openDrawerToEdit: (record: Invoice) => void;
  handleDeleteInvoice: (id: number) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoiceData,
  customers,
  loading,
  pagination,
  handleTableChange,
  openViewModal,
  openDrawerToEdit,
  handleDeleteInvoice,
}) => {
  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (id: number) =>
        customers.find((c) => c.id === id)?.displayName || 'Unknown',
    },
    { title: 'Billing Address', dataIndex: 'billingAddress' },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      sorter: true,
      render: (text: string) => moment(text).format('YYYY-MM-DD'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: true,
      render: (text: string) => moment(text).format('YYYY-MM-DD'),
    },
    { title: 'Store', dataIndex: 'store' },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      sorter: true,
      render: (amount: number) => (amount ? `$${amount.toFixed(2)}` : '$0.00'),
    },
    {
      title: 'Actions',
      render: (_: any, record: Invoice) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => openViewModal(record)}
            style={{ marginRight: 8 }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => openDrawerToEdit(record)}
            style={{ marginRight: 8 }}
          />
          <Popconfirm
            title="Are you sure you want to delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.invoiceId)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={invoiceData}
      columns={columns}
      rowKey="invoiceId"
      loading={loading}
      pagination={pagination}
      onChange={handleTableChange}
      sortDirections={['ascend', 'descend']}
    />
  );
};

export default InvoiceTable;