import axios from "axios";
import { Product, ApiResponse, AccountOption } from "../interfaces";

const API_URL = import.meta.env.VITE_API_URL;
const getAuthDetails = () => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID");
  }

  return { token, realmId };
};

export async function getProducts(
  page: number = 1,
  pageSize: number = 10,
  sortColumn: string = "name",
  sortDirection: string = "asc",
  search: string = "",
  active: boolean
): Promise<ApiResponse<Product[]>> {
  try {
    const realmId = localStorage.getItem("qb_realm_id");
    const response = await axios.get<ApiResponse<Product[]>>(
      `${API_URL}/api/Product?realmId=${realmId}&page=${page}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}&search=${search}&active=${active}&pagination=true`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function createProduct(
  product: Partial<Product>
): Promise<Product> {
  try {
    const { token, realmId } = getAuthDetails();

    const response = await axios.post<ApiResponse<Product>>(
      `${API_URL}/api/Product?realmId=${realmId}`,
      product,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.message || "Failed to create product");
    }

    return response.data.data as Product;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  product: Partial<Product>
): Promise<Product> {
  try {
    const { token, realmId } = getAuthDetails();

    const response = await axios.put<ApiResponse<Product>>(
      `${API_URL}/api/Product/${id}?realmId=${realmId}`,
      product,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.message || "Failed to update product");
    }

    return response.data.data as Product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { token, realmId } = getAuthDetails();

    const response = await axios.delete<ApiResponse<null>>(
      `${API_URL}/api/Product/${id}?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.message || "Failed to delete product");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function syncProducts(): Promise<void> {
  try {
    const { token, realmId } = getAuthDetails();

    const response = await axios.get(
      `${API_URL}/api/Product/fetch?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.message || "Failed to sync products");
    }
  } catch (error) {
    console.error("Failed to download products:", error);
    throw error;
  }
}

export async function getAccounts(): Promise<{
  incomeAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  inventoryAssetAccounts: AccountOption[];
}> {
  try {
    const token = localStorage.getItem("qb_access_token");
    const realmId = localStorage.getItem("qb_realm_id");
    const response = await axios.get(
      `${API_URL}/api/Account/chart?realmId=${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;

    return {
      incomeAccounts:
        data.incomeAccounts?.map((account: any) => ({
          id: account.quickBooksAccountId,
          name: account.name,
        })) || [],
      expenseAccounts:
        data.expenseAccounts?.map((account: any) => ({
          id: account.quickBooksAccountId,
          name: account.name,
        })) || [],
      inventoryAssetAccounts:
        data.inventoryAssetAccounts?.map((account: any) => ({
          id: account.quickBooksAccountId,
          name: account.name,
        })) || [],
    };
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    throw new Error("Failed to fetch accounts from QuickBooks");
  }
}

export const markProductAsActive = async (id: string) => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID.");
  }

  try {
    const response = await axios.put(
      `${API_URL}/api/Product/markActive/${id}?realmId=${realmId}`,
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
