// src/services/invoiceService.js
import { apiRequest } from "../apiServices/apiCall";

export const invoiceService = {
  // Get all invoices with pagination and filtering
  getAllInvoices: async (
    page = 1,
    pageSize = 10,
    searchText = "",
    sortField = "createdAt",
    sortOrder = "desc",
    pagination = false,
    sourceSystem = "all",
    isBill = false,
    
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      pagination: pagination,
      source: sourceSystem !== "all" ? sourceSystem : undefined,
      isBill: isBill,
    };
    console.log(params);
    return await apiRequest("GET", "/api/Invoice", undefined, { params });
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    return await apiRequest("GET", `/api/Invoice/${id}`);
  },

  // Create new invoice
  createInvoice: async (invoiceData: object, platform: string) => {
    return await apiRequest("POST", `/api/Invoice/add?platform=${platform}`, invoiceData);
  },

  // Update existing invoice
  updateInvoice: async (id: string, invoiceData: object, platform: string) => {
    return await apiRequest("PUT", `/api/Invoice/edit?id=${id}&platform=${platform}`, invoiceData);
  },

  // Delete invoice
  deleteInvoice: async (id: string, platform: string) => {
    return await apiRequest("DELETE", `/api/Invoice/delete?id=${id}&platform=${platform}&status=DELETED`);
  },


  // Sync invoices from external system
  syncInvoices: async (sourceSystem: string) => {
    return await apiRequest<any>("GET", `/api/Invoice/fetch-${sourceSystem == "QuickBooks" ? "qbo" : "xero"}`);
  },

  // Upload invoices via file
  uploadInvoices: async (formData) => {
    return await apiRequest("POST", "/api/Invoice/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get invoice statistics
  getInvoiceStats: async (dateRange) => {
    const params = dateRange ? {
      startDate: dateRange[0].format("YYYY-MM-DD"),
      endDate: dateRange[1].format("YYYY-MM-DD")
    } : undefined;

    return await apiRequest("GET", "/api/Invoice/stats", undefined, { params });
  },
};

// Product service
export const productService = {
  getAllProducts: async (
    page = 1,
    pageSize = 1000,
    searchText = "",
    sortField = "name",
    sortOrder = "asc",
    activeOnly = true,
    pagination = false
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      active: activeOnly,
      pagination: pagination,
    };
    return await apiRequest("GET", "/api/Product/all", undefined, { params });
  },
};