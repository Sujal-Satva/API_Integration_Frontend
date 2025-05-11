
// import { Table, Tag, Button, Space, Tooltip, Popconfirm, Badge } from "antd";
// import { EyeOutlined, EditOutlined, DeleteOutlined, MailOutlined } from "@ant-design/icons";
// import moment from "moment";

// const InvoiceTable = ({
//   invoiceData,
//   customers,
//   loading,
//   pagination,
//   handleTableChange,
//   openViewModal,
//   openDrawerToEdit,
//   handleDeleteInvoice,
// }) => {
//   // Calculate if invoice is overdue
//   const isOverdue = (dueDate, status) => {
//     return status !== "PAID" && moment(dueDate).isBefore(moment(), "day");
//   };
//   console.log(pagination,"pagination");
//   // Format currency with symbol
//   const formatCurrency = (amount, currency = "USD") => {
//     return `${currency} ${amount?.toFixed(2)}`;
//   };

//   // Get customer name from id
//   const getCustomerName = (customerId) => {
//     const customer = customers.find(
//       (c) => String(c.id) === String(customerId) || String(c.qbId) === String(customerId)
//     );
//     return customer?.name || customer?.customerName;
//   };

//   const columns = [
//     {
//       title: "Invoice #",
//       dataIndex: "invoiceNumber",
//       key: "invoiceNumber",
//       sorter: true,
//       render: (text, record) => (
//         <Button type="link" onClick={() => openViewModal(record)} style={{ padding: 0 }}>
//           {text}
//         </Button>
//       ),
//     },
//     {
//       title: "Customer",
//       dataIndex: "customerName",
//       key: "customerName",
//       sorter: true,
//       render: (text, record) => getCustomerName(record.customerId) || text,
//     },
//     {
//       title: "Date",
//       dataIndex: "invoiceDate",
//       key: "invoiceDate",
//       sorter: true,
//       render: (date) => moment(date).format("MM/DD/YYYY"),
//     },
//     {
//       title: "Due Date",
//       dataIndex: "dueDate",
//       key: "dueDate",
//       sorter: true,
//       render: (date, record) => (
//         <span>
//           {isOverdue(date, record.status) ? (
//             <Badge status="error" text={moment(date).format("MM/DD/YYYY")} />
//           ) : (
//             moment(date).format("MM/DD/YYYY")
//           )}
//         </span>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       filters: [
//         { text: "Draft", value: "DRAFT" },
//         { text: "Sent", value: "SENT" },
//         { text: "Paid", value: "PAID" },
//         { text: "Overdue", value: "OVERDUE" },
//       ],
//       render: (status, record) => {
//         let color = "default";
//         let displayStatus = status;
        
//         if (status === "PAID") color = "green";
//         else if (status === "DRAFT") color = "blue";
//         else if (status === "SENT") color = "orange";
//         else if (status === "OVERDUE") color = "red";
        
//         // Override display status if actually overdue
//         if (isOverdue(record.dueDate, status) && status !== "PAID") {
//           color = "red";
//           displayStatus = "OVERDUE";
//         }
        
//         return <Tag color={color}>{displayStatus}</Tag>;
//       },
//     },
//     {
//       title: "Total",
//       dataIndex: "total",
//       key: "total",
//       sorter: true,
//       align: "right",
//       render: (amount, record) => formatCurrency(amount, record.currencyCode),
//     },
//     {
//       title: "Balance",
//       dataIndex: "amountDue",
//       key: "amountDue",
//       align: "right",
//       render: (amount, record) => {
//         const isPaid = amount <= 0 || record.status === "PAID";
//         return (
//           <span style={{ color: isPaid ? "green" : undefined }}>
//             {formatCurrency(amount, record.currencyCode)}
//           </span>
//         );
//       },
//     },
//     {
//       title: "Source",
//       dataIndex: "sourceSystem",
//       key: "sourceSystem",
//       filters: [
//         { text: "QuickBooks", value: "QuickBooks" },
//         { text: "Xero", value: "Xero" },
//       ],
//       render: (source) => <Tag>{source}</Tag>,
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 150,
//       render: (_, record) => (
//         <Space size="small">
//           <Tooltip title="View">
//             <Button
//               type="text"
//               icon={<EyeOutlined />}
//               onClick={() => openViewModal(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               icon={<EditOutlined />}
//               onClick={() => openDrawerToEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Send">
//             <Button
//               type="text"
//               icon={<MailOutlined />}
//               disabled={record.status === "PAID"}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Are you sure you want to delete this invoice?"
//               onConfirm={() => handleDeleteInvoice(record.invoiceId)}
//               okText="Yes"
//               cancelText="No"
//               placement="left"
//             >
//               <Button type="text" danger icon={<DeleteOutlined />} />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <Table
//       columns={columns}
//       dataSource={invoiceData}
//       loading={loading}
//       pagination={{
//         ...pagination,
//         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
//       }}
//       onChange={handleTableChange}
//       rowKey="id"
//       size="middle"
//       scroll={{ x: 1200 }}
//     />
//   );
// };

// export default InvoiceTable;