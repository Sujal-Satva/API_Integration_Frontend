import { apiRequest } from "./../apiServices/apiCall"; // adjust path as needed
import {
  Bill,
  ApiResponse,
  QuickBooksBillPayload,
  PaginationConfig,
  Vendor,
  Category,
  Product,
  Customer,
} from "../interfaces";

export const billService = {
  fetchBills: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = "",
    sortColumn: string = "UpdatedAt",
    sortDirection: string = "desc",
    sourceFilter: string = "all",
    showInactive: boolean = false,
  ) => {
    const params = {
      page,
      pageSize,
      search,
      sortColumn,
      sortDirection,
      sourceSystem:sourceFilter,
      active:showInactive
    };

    return await apiRequest<ApiResponse<Bill[]>>("GET", `/api/Bills`, undefined, { params });
  },

  syncBillsFromQuickBooks: async (platform:string) => {
    return await apiRequest<any>("GET", `/api/Bills/fetch-${platform=="QuickBooks" ? "qbo" : "xero"}`);
  },

  saveBill: async (payload:object,platform:string) => {
    return await apiRequest<any>("POST", `/api/bills/add?platform=${platform}`, payload);
  },
};

export const vendorService = {
  fetchVendors: async () => {
    return await apiRequest<ApiResponse<Vendor[]>>("GET", `/api/Vendor`, undefined, {
      params: { pagination: false, active: true },
    });
  },
};

export const categoryService = {
  fetchCategories: async () => {
    return await apiRequest<ApiResponse<Category[]>>("GET", `/api/Account/all`, undefined, {
      params: { pagination: false },
    });
  },
};

export const productService = {
  fetchProducts: async () => {
    return await apiRequest<ApiResponse<Product[]>>("GET", `/api/Product/all`, undefined, {
      params: { pagination: false, active: true },
    });
  },
};

export const customerService = {
  fetchCustomers: async () => {
    return await apiRequest<ApiResponse<Customer[]>>("GET", `/api/Customer/all`, undefined, {
      params: { pagination: false, active: true, sourceSystem: "xero" },
    });
  },

  fetchCustomer: async (platform: string) => {
    return await apiRequest<any>("GET", `/api/Customer/fetch-${platform == "QuickBooks" ? "qbo" : "xero"}`);
  },

  addCustomer: async (data: any, platform: string) => {
    return await apiRequest<any>("POST", `/api/Customer/add?platform=${platform}`, data);
  },

  editCustomer: async (data: any, id: string, platform: string) => {
    return await apiRequest<any>("PUT", `/api/Customer/edit?id=${id}&platform=${platform}`, data);
  },

  updateCustomerStatus: async (id: string, platform: string, status: string) => {
    return await apiRequest<any>("PUT", `/api/Customer/update-status?id=${id}&platform=${platform}&status=${status}`);
  },
};
