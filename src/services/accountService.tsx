import { apiRequest } from "./../apiServices/apiCall"; // adjust path as needed


export const accountService = {
  getAllAccounts: async (
    page: number,
    pageSize: number,
    searchText: string,
    sortField: string,
    sortOrder: string,
    pagination:boolean=true,
    sourceFiler: string 
  ) => {
    const params = {
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      pagination: pagination,
      sourceSystem: sourceFiler,
    };

    return await apiRequest<any>("GET", `/api/Account/all`, undefined, { params });
  },

  fetchAccountsFromQuickBooks: async (platform:string) => {
    return await apiRequest<any>("GET", `/api/Account/fetch-${platform=="QuickBooks" ? "qbo" : "xero"}`);
  },
};
