// utils.ts
import dayjs from "dayjs";
import {
  CategoryDetail,
  ItemDetail,
  Category,
  Product,
  BillFormData,
  QuickBooksBillPayload,
} from "./interfaces";

export const formatCurrency = (amount?: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const formatQBDate = (dateObj: any): string => {
  if (!dateObj) return "";
  return dayjs(dateObj.$d).format("YYYY-MM-DD");
};

export const calculateTotal = (
  categoryDetails: CategoryDetail[],
  itemDetails: ItemDetail[]
): number => {
  const categoryTotal = categoryDetails.reduce(
    (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
    0
  );
  const itemTotal = itemDetails.reduce(
    (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
    0
  );
  return categoryTotal + itemTotal;
};

export const buildQuickBooksBillPayload = (
  formData: BillFormData,
  selectedVendor: string,
  categories: Category[],
  products: Product[]
): QuickBooksBillPayload => {
  const lines: {
    Amount: number;
    DetailType: string;
    AccountBasedExpenseLineDetail?: {
      AccountRef: { value: string };
      CustomerRef: { value: string } | null;
    };
    Description: string;
    ItemBasedExpenseLineDetail?: {
      ItemRef: { value: string };
      Qty: number;
      UnitPrice: number;
      CustomerRef: { value: string } | null;
      BillableStatus: string;
    };
  }[] = [];

  // Add Account-based expense lines (categoryDetails)
  if (Array.isArray(formData.categoryDetails)) {
    formData.categoryDetails.forEach((item) => {
      if (item.categoryId && item.amount >= 0) {
        const category = categories.find(
          (c) => c.quickBooksAccountId === item.categoryId
        );
        const qbAccountId = category?.quickBooksAccountId || item.categoryId;

        lines.push({
          Amount: item.amount,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: qbAccountId.toString(),
            },
            CustomerRef: item.customerId
              ? {
                  value: item.customerId.toString(),
                }
              : null,
          },
          Description: item.description || "Category detail",
        });
      }
    });
  }
  if (Array.isArray(formData.itemDetails)) {
    formData.itemDetails.forEach((item) => {
      if (item.productId && item.amount >= 0) {
        const product = products.find((p) => p.id === item.productId);
        const qbItemId = product?.qbItemId || String(item.productId);

        lines.push({
          Amount: item.amount,
          DetailType: "ItemBasedExpenseLineDetail",
          ItemBasedExpenseLineDetail: {
            ItemRef: {
              value: qbItemId.toString(),
            },
            Qty: item.qty,
            UnitPrice: item.rate,
            CustomerRef: item.customerId
              ? {
                  value: item.customerId.toString(),
                }
              : null,
            BillableStatus: item.billableStatus || "NotBillable",
          },
          Description: "Item detail line",
        });
      }
    });
  }
  const payload: QuickBooksBillPayload = {
    VendorRef: {
      value: selectedVendor,
    },
    APAccountRef: {
      value: "33",
    },
    TxnDate: formData.billDate ?? "",
    DueDate: formData.dueDate,
    PrivateNote: formData.privateNote || "",
    Line: lines,
    TotalAmt: formData.totalAmt,
    CurrencyRef: {
      value: "USD",
    },
  };

  return payload;
};

export const getQuickBooksAuth = () => {
  const token = localStorage.getItem("qb_access_token");
  const realmId = localStorage.getItem("qb_realm_id");

  if (!token || !realmId) {
    throw new Error("Missing QuickBooks access token or realm ID.");
  }

  return { token, realmId };
};
