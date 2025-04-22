import { message } from "antd";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAllAccounts = async (
  realmId: string | null,
  page: number,
  pageSize: number,
  searchText: string,
  sortField: string,
  sortOrder: string
) => {
  const token = localStorage.getItem("qb_access_token");
  if (!token || !realmId) {
    message.error("Missing QuickBooks access token or realm ID.");
    return null;
  }
  const response = await axios.get(`${API_URL}/api/Account/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      realmId,
      page,
      pageSize,
      search: searchText,
      sortColumn: sortField,
      sortDirection: sortOrder,
    },
  });
  return response.data;
};

const fetchAccountsFromQuickBooks = async (token: string, realmId: string) => {
  const response = await axios.get(
    `${API_URL}/api/Account/fetch?realmId=${realmId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const accountService = {
  getAllAccounts,
  fetchAccountsFromQuickBooks,
};
