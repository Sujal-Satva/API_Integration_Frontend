import axios from "axios";
import { Vendor, VendorFormValues, ApiResponse } from "../interfaces";

const API_URL = import.meta.env.VITE_API_URL;

const getToken = (): string => localStorage.getItem("qb_access_token") || "";
const getRealmId = (): string => localStorage.getItem("qb_realm_id") || "";

export async function fetchVendors(params): Promise<ApiResponse<Vendor[]>> {
  try {
    const response = await axios.get<ApiResponse<Vendor[]>>(
      `${API_URL}/api/Vendor?realmId=${getRealmId()}`,
      {
        params,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Failed to load vendors");
  }
}

export async function addVendor(
  vendorData: VendorFormValues
): Promise<ApiResponse<Vendor>> {
  const token = getToken();
  const realmId = getRealmId();

  const payload = {
    ...vendorData,
    currencyValue: "USD",
    currencyName: "United States Dollar",
    active: true,
  };

  try {
    const response = await axios.post<ApiResponse<Vendor>>(
      `${API_URL}/api/Vendor/add?realmId=${realmId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding vendor:", error);
    if (error.response?.data?.error) {
      const errorObj = JSON.parse(error.response.data.error);
      throw new Error(
        errorObj.Fault?.Error[0]?.Detail || "Failed to add vendor"
      );
    }
    throw new Error("Failed to add vendor");
  }
}

export async function updateVendor(
  id: string,
  vendorData: VendorFormValues
): Promise<ApiResponse<Vendor>> {
  const token = getToken();
  const realmId = getRealmId();

  const payload = {
    ...vendorData,
    currencyValue: "USD",
    currencyName: "United States Dollar",
    active: true,
  };

  try {
    const response = await axios.put(
      `${API_URL}/api/Vendor/update/${id}?realmId=${realmId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating vendor:", error);
    if (error.response?.data?.error) {
      const errorObj = JSON.parse(error.response.data.error);
      throw new Error(
        errorObj.Fault?.Error[0]?.Detail || "Failed to update vendor"
      );
    }
    throw new Error("Failed to update vendor");
  }
}

export async function deleteVendor(id: string) {
  const token = getToken();
  const realmId = getRealmId();

  try {
    const response = await axios.delete(
      `${API_URL}/api/Vendor/delete/${id}?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw new Error("Failed to delete vendor");
  }
}

export async function activateVendor(id: string) {
  const token = getToken();
  const realmId = getRealmId();

  try {
    const response = await axios.put(
      `${API_URL}/api/Vendor/${id}/activate?realmId=${realmId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error activating vendor:", error);
    throw new Error("Failed to mark vendor as active");
  }
}

export async function syncVendors() {
  const token = getToken();
  const realmId = getRealmId();

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID");
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/Vendor/fetch?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error syncing vendors:", error);
    throw new Error("Failed to download vendors");
  }
}
