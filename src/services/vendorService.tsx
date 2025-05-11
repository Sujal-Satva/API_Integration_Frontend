import { apiRequest } from "./../apiServices/apiCall"; // adjust path as needed

export const vendorService = {
  getAllVendors: async (
    page: number,
    pageSize: number,
    searchText: string,
    sortField: string,
    sortOrder: string,
    sourceFilter: string,
    showActive: boolean = false,
    pagination: boolean = false
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      // sourceSystem: sourceFilter === "all" ? null : sourceFilter,
      active: showActive,
      pagination
    };

    return await apiRequest<any>("GET", `/api/Vendor/all`, undefined, { params });
  },

  fetchVendors: async (platform: string) => {
    return await apiRequest<any>("GET", `/api/Vendor/fetch-${platform === "QuickBooks" ? "qbo" : "xero"}`);
  },

  addVendor: async (data: any, platform: string) => {
    return await apiRequest<any>("POST", `/api/Vendor/add?platform=${platform}`, data);
  },

  editVendor: async (data: any, id: string, platform: string) => {
    return await apiRequest<any>("PUT", `/api/Vendor/edit?id=${id}&platform=${platform}`, data);
  },
  
  updateVendorStatus: async (id: string, platform: string, status: string) => {
    return await apiRequest<any>("PUT", `/api/Vendor/update-status?id=${id}&platform=${platform}&status=${status}`);
  }
};