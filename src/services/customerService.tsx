import axios from "axios";
import { Customer } from "../interfaces";
import { message } from "antd";
const API_URL = import.meta.env.VITE_API_URL;

export const fetchCustomers = async (
  page = 1,
  pageSize = 10,
  searchTerm = "",
  sortColumn = "DisplayName",
  sortDirection = "asc",
  activestatus = true
) => {
  try {
    const token = localStorage.getItem("qb_access_token");
    const realmId = localStorage.getItem("qb_realm_id");

    if (!token || !realmId) {
      message.error("Missing QuickBooks access token or realm ID.");
      return null;
    }
    const response = await fetch(
      `${API_URL}/api/Customer/all?realmId=${realmId}&page=${page}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}&search=${searchTerm}&active=${activestatus}&pagination=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return handleApiError(error);
  }
};

export const saveCustomer = async (
  customerData: any,
  isEditMode: boolean,
  currentCustomer: Customer
) => {
  const method = isEditMode ? "PUT" : "POST";
  const url = isEditMode
    ? `${API_URL}/api/Customer/${currentCustomer.id}`
    : `${API_URL}/api/Customer`;

  const realmId = localStorage.getItem("qb_realm_id");
  const token = localStorage.getItem("qb_access_token");
  try {
    const response = await fetch(`${url}?realmId=${realmId}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    const data = await response.json();
    if (!response.ok) {
      return data.Fault?.Error?.[0]?.Detail || "Failed to save customer.";
    }
    return data;
  } catch (error) {
    console.log(error);
    return handleApiError(error);
  }
};

export const deleteCustomer = async (id: any) => {
  const realmId = localStorage.getItem("qb_realm_id");
  const token = localStorage.getItem("qb_access_token");

  try {
    const response = await axios.delete(
      `${API_URL}/api/Customer/${id}?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return handleApiError(error);
  }
};

export const downloadCustomers = async () => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID.");
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/Customer/fetch?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);
    return handleApiError(error);
  }
};

export const markCustomerAsActive = async (id: string) => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID.");
  }

  try {
    const response = await axios.put(
      `${API_URL}/api/Customer/markActive/${id}?realmId=${realmId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);
    return handleApiError(error);
  }
};

const handleApiError = (err: any): string => {
  try {
    if (err instanceof Error) {
      return err.message || "Unexpected error occurred.";
    }

    const obj = JSON.parse(err?.response?.data?.error);
    return obj?.Fault?.Error?.[0]?.Detail || "An unexpected error occurred.";
  } catch (parseError) {
    return (
      "Failed to parse error: " +
      (parseError instanceof Error ? parseError.message : String(parseError))
    );
  }
};
