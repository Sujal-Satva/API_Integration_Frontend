import { apiRequest } from "./../apiServices/apiCall"; // adjust path as needed


export const accountService = {
  getAllAccounts: async (
    realmId: string | null,
    page: number,
    pageSize: number,
    searchText: string,
    sortField: string,
    sortOrder: string,
    sourceFiler: string 
  ) => {
    const params = {
      realmId,
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
      sourceSystem: sourceFiler,
    };

    return await apiRequest<any>("GET", `/api/Account/all`, undefined, { params });
  },

  fetchAccountsFromQuickBooks: async (platform:string) => {
    return await apiRequest<any>("GET", `/api/Account/fetch-${platform=="QuickBooks" ? "qbo" : "xero"}`);
  },
};
