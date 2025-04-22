import { Moment } from "moment";

export interface Customer {
  id: number;
  displayName: string;
  isActive: boolean;
  email: string;
  line1: string;
}

export interface Product {
  id: number;
  qbItemId: string;
  name: string;
  active: boolean;
  unitPrice: number;
}

export interface LineItem {
  id: number;
  productId?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  invoiceId: number;
  customerId: number;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  store: string;
  billingAddress: string;
  subtotal: number;
  total: number;
  status?: string;
  lineItems: LineItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationParams {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions: string[];
  showSizeChanger: boolean;
}

export interface SorterParams {
  field: string;
  order: "ascend" | "descend";
}

export interface InvoiceFormValues {
  customer: number;
  customerEmail: string;
  invoiceDate: Moment;
  dueDate: Moment;
  store: string;
  billingAddress: string;
}

export interface Product {
  id: any;
  name: string;
  type: "Service" | "Inventory";
  fullyQualifiedName: string;
  unitPrice: number;
  taxable: boolean;
  description: string;
  incomeAccountValue: string; // Changed from incomeAccountValue
  incomeAccountName: string;
  expenseAccountValue?: string; // Changed from expenseAccountValue
  expenseAccountName?: string;
}

export interface ProductFormValues {
  name: string;
  type: "Service" | "Inventory";
  unitPrice: number;
  description?: string;
  taxable: boolean;
  incomeAccountValue?: string; // Changed to direct ID
  expenseAccountValue?: string; // Changed to direct ID
  fullyQualifiedName?: string;
}

export interface AccountOption {
  id: string;
  name: string;
  accountType: string; // Added to track account type
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  totalPages: number;
  error?: string;
  message?: string;
}

export interface Vendor {
  id: string;
  vId: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
  balance: number;
  currencyValue: string;
  currencyName: string;
  billAddrLine1?: string;
  billAddrCity?: string;
  billAddrPostalCode?: string;
  primaryPhone?: string;
  primaryEmailAddr?: string;
  webAddr?: string;
  active: boolean;
}

export interface VendorFormValues {
  displayName: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
  balance: number;
  billAddrLine1?: string;
  billAddrCity?: string;
  billAddrPostalCode?: string;
  primaryPhone?: string;
  primaryEmailAddr?: string;
  webAddr?: string;
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  column: string;
  direction: string;
}

export interface FetchVendorsParams {
  page: number;
  pageSize: number;
  search?: string;
  sortColumn?: string;
  sortDirection?: string;
  pagination?: boolean;
  active?: boolean;
}

export interface Vendor {
  id: number;
  vId: string;
  displayName: string;
  billAddrLine1?: string;
  billAddrCity?: string;
  billAddrPostalCode?: string;
}

export interface Category {
  id: number;
  quickBooksAccountId: string;
  name: string;
  accountType: string;
}

export interface Product {
  id: number;
  name: string;
  unitPrice: number;
  qbItemId: string;
}

export interface Customer {
  id: number;
  displayName: string;
}

export interface CategoryDetail {
  id: number;
  categoryId: string | null;
  description: string;
  amount: number;
  customerId: number | null;
  qbAccountId?: string;
}

export interface ItemDetail {
  id: number;
  productId: number | null;
  qty: number;
  rate: number;
  amount: number;
  customerId: number | null;
  qbItemId?: string;
  billableStatus?: string;
}

export interface BillLine {
  id: number;
  lineNum: number;
  description: string;
  amount: number;
  detailType: string;
  accountName: string;
  customerName?: string;
  productName?: string;
  billableStatus?: string;
  qty?: number;
  unitPrice?: number;
}

export interface Bill {
  id: number;
  quickBooksBillId: string;
  txnDate: string;
  dueDate: string;
  vendorName: string;
  totalAmt: number;
  balance: number;
  privateNote?: string;
  apAccountName: string;
  billLines: BillLine[];
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger: boolean;
  pageSizeOptions: string[];
}

export interface BillFormData {
  vendorId: number;
  billDate: any; // dayjs object
  dueDate: any; // dayjs object
  privateNote?: string;
  categoryDetails: CategoryDetail[];
  itemDetails: ItemDetail[];
  totalAmt: number;
}

export interface QuickBooksBillPayload {
  VendorRef: {
    value: string;
  };
  APAccountRef: {
    value: string;
  };
  TxnDate: string;
  DueDate: string;
  PrivateNote: string;
  Line: Array<QuickBooksBillLine>;
  TotalAmt: number;
  CurrencyRef: {
    value: string;
  };
}

export interface QuickBooksBillLine {
  Amount: number;
  DetailType: "AccountBasedExpenseLineDetail" | "ItemBasedExpenseLineDetail";
  AccountBasedExpenseLineDetail?: {
    AccountRef: {
      value: string;
    };
    CustomerRef: {
      value: string;
    } | null;
  };
  ItemBasedExpenseLineDetail?: {
    ItemRef: {
      value: string;
    };
    Qty: number;
    UnitPrice: number;
    CustomerRef: {
      value: string;
    } | null;
    BillableStatus: string;
  };
  Description: string;
}

export interface ApiResponse<T> {
  data: T;
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  error?: string;
}
