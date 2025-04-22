import axios from "axios";
import { Invoice, Customer, Product } from "./../interfaces";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch(
      `${API_URL}/api/Customer/all?pagination=false`
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_URL}/api/Product?pagination=false`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
};

export const fetchInvoices = async (
  page = 1,
  pageSize = 10,
  sortBy = "createdAt",
  sortDirection = "desc",
  search = ""
): Promise<{
  data: Invoice[];
  page: number;
  pageSize: number;
  totalRecords: number;
}> => {
  try {
    const response = await fetch(
      `${API_URL}/api/Invoice?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}&search=${search}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices");
  }
};

export const createInvoice = async (invoicePayload: any): Promise<any> => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");
  try {
    const response = await axios.post(
      `${API_URL}/api/Invoice?realmId=${realmId}`,
      invoicePayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response);
    return response.data;
  } catch (err: any) {
    console.log(err);
    handleApiError(err);
    throw err;
  }
};

export const updateInvoice = async (
  invoiceId: number,
  invoicePayload: any
): Promise<any> => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");
  try {
    const response = await axios.put(
      `${API_URL}/api/Invoice/${invoiceId}?realmId=${realmId}`,
      invoicePayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    handleApiError(err);
    throw err;
  }
};

export const deleteInvoice = async (id: number): Promise<any> => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");
  try {
    const response = await axios.delete(
      `${API_URL}/api/Invoice/${id}?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw new Error("Failed to delete invoice");
  }
};

export const syncInvoices = async (): Promise<any> => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID.");
  }
  try {
    const res = await axios.get(
      `${API_URL}/api/Invoice/fetch?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Failed to download invoices:", error);
    throw new Error("Failed to download invoices.");
  }
};

const handleApiError = (err: any): void => {
  try {
    const obj = JSON.parse(err.response.data.error);
    if (obj?.Fault?.Error?.[0]?.Detail) {
      console.error(obj.Fault.Error[0].Detail);
    } else {
      console.error(
        "An unexpected error occurred while processing the request."
      );
    }
  } catch (parseError) {
    console.error("Failed to parse the error response:", parseError);
  }
};
