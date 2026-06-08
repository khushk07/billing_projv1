import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

// ---------------------------------------------------------------------------
// Mapper: DB row (snake_case) → TypeScript Product (camelCase)
// ---------------------------------------------------------------------------
function toProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    variant: (row.variant as string) ?? undefined,
    sellingPrice: row.selling_price as number,
    stockQuantity: row.stock_quantity as number,
    lowStockThreshold: row.low_stock_threshold as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Mapper: TypeScript partial fields → DB row (snake_case)
// ---------------------------------------------------------------------------
function toDbFields(
  input: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (input.name !== undefined) map.name = input.name;
  if (input.category !== undefined) map.category = input.category;
  if (input.subcategory !== undefined) map.subcategory = input.subcategory;
  if (input.variant !== undefined) map.variant = input.variant;
  if (input.sellingPrice !== undefined) map.selling_price = input.sellingPrice;
  if (input.stockQuantity !== undefined) map.stock_quantity = input.stockQuantity;
  if (input.lowStockThreshold !== undefined)
    map.low_stock_threshold = input.lowStockThreshold;
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return (data ?? []).map(toProduct);
}

export async function addProduct(
  input: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      category: input.category,
      subcategory: input.subcategory,
      variant: input.variant ?? null,
      selling_price: input.sellingPrice,
      stock_quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold ?? 5,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add product: ${error.message}`);
  return toProduct(data);
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | null> {
  const dbUpdates = toDbFields(updates);
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // No matching row → treat as "not found"
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to update product: ${error.message}`);
  }
  return toProduct(data);
}

export async function restockProduct(
  id: string,
  quantityToAdd: number
): Promise<Product | null> {
  // Fetch the current product first
  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") return null;
    throw new Error(`Failed to fetch product for restock: ${fetchError.message}`);
  }

  const newQuantity = (existing.stock_quantity as number) + quantityToAdd;

  const { data, error } = await supabase
    .from("products")
    .update({
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to restock product: ${error.message}`);
  return toProduct(data);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(`Failed to delete product: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function reduceStockForSale(
  items: { sourceId?: string; quantity: number; source: string }[]
): Promise<void> {
  for (const item of items) {
    if (item.source !== "catalogue" || !item.sourceId) continue;

    // Fetch current stock
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.sourceId)
      .single();

    if (fetchError) {
      // Product not found — skip silently (same behaviour as original)
      if (fetchError.code === "PGRST116") continue;
      throw new Error(
        `Failed to fetch product ${item.sourceId} for stock reduction: ${fetchError.message}`
      );
    }

    const newQuantity = Math.max(
      0,
      (existing.stock_quantity as number) - item.quantity
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.sourceId);

    if (updateError) {
      throw new Error(
        `Failed to reduce stock for product ${item.sourceId}: ${updateError.message}`
      );
    }
  }
}

export async function getLowStockProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
}
