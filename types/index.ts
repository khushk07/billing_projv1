export type StockLogSource = "manual" | "billing" | "bulk-import";

export type BillItemSource = "catalogue" | "stocklog" | "quick";

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  variant?: string;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockLogItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  approxPrice: number;
  quantity: number;
  source: StockLogSource;
  lastUsedPrice: number;
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
  promotedToCatalogue: boolean;
}

export interface BillItem {
  id: string;
  name: string;
  subcategory: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  source: BillItemSource;
  sourceId?: string;
}

export interface Sale {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  grandTotal: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastPurchaseDate: string;
  categoriesBought: string[];
  salesIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BillLine {
  id: string;
  name: string;
  subcategory: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  source: BillItemSource;
  sourceId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  billsToday: number;
  lowStockProducts: Product[];
  topSubcategoryThisWeek: { subcategory: string; count: number } | null;
  recentSales: Sale[];
}

export interface CompleteSalePayload {
  customerName: string;
  customerPhone: string;
  items: BillLine[];
}

export type DataFileName =
  | "inventory"
  | "stocklog"
  | "sales"
  | "customers";
