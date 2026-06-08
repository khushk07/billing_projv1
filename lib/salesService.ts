import { supabase } from "@/lib/supabase";
import { getNextBillNumber } from "@/lib/billNumber";
import { reduceStockForSale } from "@/lib/inventoryService";
import { updateStockLogUsage } from "@/lib/stocklogService";
import { upsertCustomerFromSale, getCustomerById } from "@/lib/customersService";
import type { BillItem, CompleteSalePayload, Sale } from "@/types";

/* ── helpers: snake_case DB row ↔ camelCase TS type ─────────── */

interface SaleRow {
  id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  grand_total: number;
  created_at: string;
  sale_items?: SaleItemRow[];
}

interface SaleItemRow {
  id: string;
  sale_id: string;
  name: string;
  subcategory: string;
  category: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  source: string;
  source_id: string | null;
}

function toBillItem(row: SaleItemRow): BillItem {
  return {
    id: row.id,
    name: row.name,
    subcategory: row.subcategory,
    category: row.category,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total,
    source: row.source as BillItem["source"],
    sourceId: row.source_id ?? undefined,
  };
}

function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    billNumber: row.bill_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    items: (row.sale_items ?? []).map(toBillItem),
    grandTotal: row.grand_total,
    createdAt: row.created_at,
  };
}

/* ── service functions ──────────────────────────────────────── */

/**
 * Returns all sales, newest first.
 */
export async function getAllSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch sales: ${error.message}`);
  return (data as SaleRow[]).map(toSale);
}

/**
 * Completes a sale: persist sale, update stock, customers, stock log usage.
 */
export async function completeSale(
  payload: CompleteSalePayload
): Promise<Sale> {
  const phone = payload.customerPhone.replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) {
    throw new Error("Phone must be 10 digits");
  }
  if (!payload.customerName.trim()) {
    throw new Error("Customer name is required");
  }
  if (payload.items.length === 0) {
    throw new Error("Bill must have at least one item");
  }

  // Get next bill number from existing sales
  const { data: existingSales, error: salesErr } = await supabase
    .from("sales")
    .select("bill_number");

  if (salesErr) throw new Error(`Failed to fetch sales: ${salesErr.message}`);

  const billNumber = getNextBillNumber(
    (existingSales ?? []).map((s: { bill_number: string }) => ({
      billNumber: s.bill_number,
    })) as Sale[]
  );

  const now = new Date().toISOString();

  const billItems = payload.items.map((line) => ({
    id: line.id,
    name: line.name,
    subcategory: line.subcategory,
    category: line.category,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    source: line.source,
    sourceId: line.sourceId,
  }));

  const grandTotal = billItems.reduce((sum, i) => sum + i.lineTotal, 0);

  // Build the sale object for customer upsert (needs items for categoriesBought)
  const saleForCustomer: Sale = {
    id: "", // will be set after insert
    billNumber,
    customerId: "",
    customerName: payload.customerName.trim(),
    customerPhone: phone,
    items: billItems as BillItem[],
    grandTotal,
    createdAt: now,
  };

  // Upsert customer first (we need the customer ID for the sale)
  // Temporarily set a placeholder id — upsertCustomerFromSale uses sale.id for salesIds
  const tempSaleId = crypto.randomUUID();
  saleForCustomer.id = tempSaleId;

  const customer = await upsertCustomerFromSale(saleForCustomer);

  // Insert the sale
  const { data: saleRow, error: insertErr } = await supabase
    .from("sales")
    .insert({
      id: tempSaleId,
      bill_number: billNumber,
      customer_id: customer.id,
      customer_name: payload.customerName.trim(),
      customer_phone: phone,
      grand_total: grandTotal,
      created_at: now,
    })
    .select()
    .single();

  if (insertErr) throw new Error(`Failed to create sale: ${insertErr.message}`);

  // Insert sale items
  const saleItemRows = billItems.map((item) => ({
    sale_id: saleRow.id,
    name: item.name,
    subcategory: item.subcategory,
    category: item.category,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
    source: item.source,
    source_id: item.sourceId ?? null,
  }));

  const { error: itemsErr } = await supabase
    .from("sale_items")
    .insert(saleItemRows);

  if (itemsErr) throw new Error(`Failed to insert sale items: ${itemsErr.message}`);

  // Reduce catalogue stock
  await reduceStockForSale(
    billItems.map((i) => ({
      sourceId: i.sourceId,
      quantity: i.quantity,
      source: i.source,
    }))
  );

  // Update stock log usage
  await updateStockLogUsage(
    billItems.map((i) => ({
      sourceId: i.sourceId,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      source: i.source,
    }))
  );

  // Return the complete sale
  const sale: Sale = {
    id: saleRow.id,
    billNumber,
    customerId: customer.id,
    customerName: payload.customerName.trim(),
    customerPhone: phone,
    items: billItems as BillItem[],
    grandTotal,
    createdAt: saleRow.created_at,
  };

  return sale;
}

/**
 * Gets sales for a specific customer.
 */
export async function getSalesByCustomerId(
  customerId: string
): Promise<Sale[]> {
  const customer = await getCustomerById(customerId);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch customer sales: ${error.message}`);
  return (data as SaleRow[]).map(toSale);
}
