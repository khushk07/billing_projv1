import { supabase } from "@/lib/supabase";
import type { Customer, Sale } from "@/types";

const TABLE = "customers";

/**
 * Maps a Supabase DB row (snake_case) to the Customer TypeScript type (camelCase).
 */
function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    totalVisits: row.total_visits as number,
    totalSpent: row.total_spent as number,
    lastPurchaseDate: row.last_purchase_date as string,
    categoriesBought: (row.categories_bought as string[]) ?? [],
    salesIds: (row.sales_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Returns all customers.
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from(TABLE).select("*");

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  return (data ?? []).map(toCustomer);
}

/**
 * Finds customer by 10-digit phone.
 */
export async function getCustomerByPhone(
  phone: string
): Promise<Customer | null> {
  const normalized = phone.replace(/\D/g, "").slice(-10);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("phone", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch customer by phone: ${error.message}`);
  }

  return data ? toCustomer(data) : null;
}

/**
 * Gets customer by id.
 */
export async function getCustomerById(
  id: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch customer by id: ${error.message}`);
  }

  return data ? toCustomer(data) : null;
}

/**
 * Creates or updates customer after a sale.
 */
export async function upsertCustomerFromSale(
  sale: Sale
): Promise<Customer> {
  const phone = sale.customerPhone.replace(/\D/g, "").slice(-10);
  const categoriesFromSale = Array.from(
    new Set(sale.items.map((i) => i.category))
  );
  const now = new Date().toISOString();

  // Check for existing customer by phone
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to look up customer: ${fetchError.message}`);
  }

  if (existing) {
    // Merge categories (union of existing + new from sale)
    const existingCategories = (existing.categories_bought as string[]) ?? [];
    const mergedCategories = Array.from(
      new Set([...existingCategories, ...categoriesFromSale])
    );

    // Append new sale id
    const existingSalesIds = (existing.sales_ids as string[]) ?? [];
    const updatedSalesIds = [...existingSalesIds, sale.id];

    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({
        name: sale.customerName,
        total_visits: (existing.total_visits as number) + 1,
        total_spent: (existing.total_spent as number) + sale.grandTotal,
        last_purchase_date: sale.createdAt,
        categories_bought: mergedCategories,
        sales_ids: updatedSalesIds,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(`Failed to update customer: ${updateError.message}`);
    }

    return toCustomer(updated);
  }

  // Insert new customer
  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .insert({
      name: sale.customerName,
      phone,
      total_visits: 1,
      total_spent: sale.grandTotal,
      last_purchase_date: sale.createdAt,
      categories_bought: categoriesFromSale,
      sales_ids: [sale.id],
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert customer: ${insertError.message}`);
  }

  return toCustomer(inserted);
}
