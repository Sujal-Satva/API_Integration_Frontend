import { apiRequest } from "./../apiServices/apiCall";

export const productService = {
  getAllProducts: async (
    page: number,
    pageSize: number,
    searchText: string,
    sortField: string,
    sortOrder: string,
    sourceFilter: string,
    showInactive: boolean = false,
    sourceType: string = "all",
    pagination: boolean = false
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      sourceSystem: sourceFilter,
      active: showInactive,
      sourceType: sourceType,
      pagination: pagination
    };
    return await apiRequest<any>("GET", `/api/Product/all`, undefined, { params });
  },

  fetchProducts: async (platform: string) => {
    return await apiRequest<any>(
      "GET",
      `/api/Product/fetch-${platform === "QuickBooks" ? "qbo" : "xero"}`
    );
  },

  addProduct: async (data: any, platform: string) => {
    return await apiRequest<any>("POST", `/api/Product/add?platform=${platform}`, data);
  },

  editProduct: async (data: any, platform: string, id: string) => {
    return await apiRequest<any>("PUT", `/api/Product/edit?platform=${platform}&itemId=${id}`, data);
  },

  updateProductStatus: async (id: string, status: boolean, platform: string) => {
    return await apiRequest<any>(
      "PUT",
      `/api/Product/update-status?id=${id}&platform=${platform}&status=${status}`,
      null
    );
  }
};
