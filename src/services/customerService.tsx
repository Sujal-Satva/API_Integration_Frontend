import { apiRequest } from "./../apiServices/apiCall"; // adjust path as needed


export const customerService = {
  getAllCustomer: async (
    
    page: number,
    pageSize: number,
    searchText: string,
    sortField: string,
    sortOrder: string,
    sourceFiler: string 
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      sourceSystem: sourceFiler,
    };

    return await apiRequest<any>("GET", `/api/Customer/all`, undefined, { params });
  },

  fetchCustomer: async (platform:string) => {
    return await apiRequest<any>("GET", `/api/Customer/fetch-${platform=="QuickBooks" ? "qbo" : "xero"}`);
  },

  addCustomer:async (data: any,platform:string) => {
    return await apiRequest<any>("POST", `/api/Customer/add?platform=${platform}`, data);
  },

  editCustomer:async (data: any,platform:string) => {
    return await apiRequest<any>("PUT", `/api/Customer/edit?platform=${platform}`, data);
  },

  deleteCustomer:async (id: string,platform:string) => {
    return await apiRequest<any>("DELETE", `/api/Customer/delete?id=${id}&platform=${platform}`);
  }
};
