import axios from "axios";
import { message } from "antd";
import { getQuickBooksAuth } from "../utils";

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

const API_URL = import.meta.env.VITE_API_URL;

export const fetchBills = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  sortColumn: string = "txnDate",
  sortDirection: string = "desc"
): Promise<{ bills: Bill[]; pagination: PaginationConfig } | null> => {
  try {
    const { token, realmId } = getQuickBooksAuth();

    const response = await axios.get<ApiResponse<Bill[]>>(
      `${API_URL}/api/Bills?page=${page}&pageSize=${pageSize}&search=${search}&sortColumn=${sortColumn}&sortDirection=${sortDirection}&realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      bills: response.data.data,
      pagination: {
        current: response.data.page || 1,
        pageSize: response.data.pageSize || 10,
        total: response.data.totalRecords || 0,
        showSizeChanger: true,
        pageSizeOptions: ["5", "10", "20", "50"],
      },
    };
  } catch (error) {
    console.error("Error fetching bills:", error);
    message.error("Failed to load bills. Please try again later.");
    return null;
  }
};

// Sync bills from QuickBooks
export const syncBillsFromQuickBooks = async (): Promise<boolean> => {
  try {
    const { token, realmId } = getQuickBooksAuth();

    await axios.get(`${API_URL}/api/Bills/fetch?realmId=${realmId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    message.success("Bills downloaded successfully!");
    return true;
  } catch (error) {
    console.error("Failed to download bills:", error);
    message.error("Failed to download bills from QuickBooks.");
    return false;
  }
};

// Save bill to QuickBooks
export const saveBill = async (
  payload: QuickBooksBillPayload
): Promise<boolean> => {
  try {
    const { token, realmId } = getQuickBooksAuth();

    const response = await axios.post(
      `${API_URL}/api/bills/add?realmId=${realmId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      const errorObj = JSON.parse(response.data.error);
      message.error(errorObj.Fault?.Error[0]?.Detail || "Error saving bill");
      return false;
    }

    message.success("Bill saved successfully!");
    return true;
  } catch (error) {
    const errorObj = JSON.parse(error.response.data.error);
    message.error(errorObj.Fault?.Error[0]?.Detail || "Error saving bill");
    return false;
  }
};

// Fetch vendors
export const fetchVendors = async (): Promise<Vendor[]> => {
  try {
    const { token } = getQuickBooksAuth();

    const response = await axios.get<ApiResponse<Vendor[]>>(
      `${API_URL}/api/Vendor?pagination=false&active=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    message.error("Failed to load vendors data.");
    return [];
  }
};

// Fetch categories/accounts
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { token } = getQuickBooksAuth();

    const response = await axios.get<ApiResponse<Category[]>>(
      `${API_URL}/api/Account/all?pagination=false`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    message.error("Failed to load categories data.");
    return [];
  }
};

// Fetch products
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { token } = getQuickBooksAuth();

    const response = await axios.get<ApiResponse<Product[]>>(
      `${API_URL}/api/Product?pagination=false&active=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    message.error("Failed to load products data.");
    return [];
  }
};

// Fetch customers
export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const { token } = getQuickBooksAuth();

    const response = await axios.get<ApiResponse<Customer[]>>(
      `${API_URL}/api/Customer/all?pagination=false&active=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    message.error("Failed to load customers data.");
    return [];
  }
};
