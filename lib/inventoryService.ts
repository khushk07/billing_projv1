import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

function encodeVariant(size?: string, color?: string, fallbackVariant?: string): string | null {
  if (size || color) {
    return JSON.stringify({ size: size || null, color: color || null });
  }
  return fallbackVariant ?? null;
}

function decodeVariant(rawVariant?: string | null): { size?: string; color?: string; variant?: string } {
  if (!rawVariant) return {};
  if (typeof rawVariant === "string" && rawVariant.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawVariant);
      const s = parsed.size || undefined;
      const c = parsed.color || undefined;
      return {
        size: s,
        color: c,
        variant: s || c ? [c, s].filter(Boolean).join(" / ") : undefined,
      };
    } catch {
      // ignore json parse error and fallback
    }
  }

  // Smartly split "Colour / Size" or "Size / Colour" string formats e.g. "Green / 30""
  if (typeof rawVariant === "string" && rawVariant.includes(" / ")) {
    const parts = rawVariant.split(" / ").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const part1IsSize = /\d|uk|us|eu|^s$|^m$|^l$|^xl$/i.test(parts[1]);
      if (part1IsSize) {
        return { color: parts[0], size: parts[1], variant: rawVariant };
      }
      const part0IsSize = /\d|uk|us|eu|^s$|^m$|^l$|^xl$/i.test(parts[0]);
      if (part0IsSize) {
        return { size: parts[0], color: parts[1], variant: rawVariant };
      }
      return { color: parts[0], size: parts[1], variant: rawVariant };
    }
  }

  return {
    size: rawVariant || undefined,
    color: undefined,
    variant: rawVariant || undefined,
  };
}

// ---------------------------------------------------------------------------
// Mapper: DB row (snake_case) → TypeScript Product (camelCase)
// ---------------------------------------------------------------------------
function toProduct(row: Record<string, unknown>): Product {
  const decoded = decodeVariant(row.variant as string);
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    size: decoded.size,
    color: decoded.color,
    variant: decoded.variant,
    sellingPrice: row.selling_price as number,
    stockQuantity: row.stock_quantity as number,
    lowStockThreshold: row.low_stock_threshold as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    hsnCode: (row.hsn_code as string) ?? undefined,
    gstPercentage: (row.gst_percentage as number) ?? undefined,
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
  if (input.size !== undefined || input.color !== undefined || input.variant !== undefined) {
    map.variant = encodeVariant(input.size, input.color, input.variant);
  }
  if (input.sellingPrice !== undefined) map.selling_price = input.sellingPrice;
  if (input.stockQuantity !== undefined) map.stock_quantity = input.stockQuantity;
  if (input.lowStockThreshold !== undefined)
    map.low_stock_threshold = input.lowStockThreshold;
  if (input.hsnCode !== undefined) map.hsn_code = input.hsnCode;
  if (input.gstPercentage !== undefined) map.gst_percentage = input.gstPercentage;
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
      variant: encodeVariant(input.size, input.color, input.variant),
      selling_price: input.sellingPrice,
      stock_quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold ?? 2,
      hsn_code: input.hsnCode ?? null,
      gst_percentage: input.gstPercentage ?? null,
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

function normalizeString(str?: string | null): string {
  if (!str) return "";
  return str.toString().toLowerCase().replace(/["'\s]/g, "").trim();
}

export async function reduceStockForSale(
  items: {
    sourceId?: string;
    name?: string;
    size?: string;
    color?: string;
    quantity: number;
    source: string;
  }[]
): Promise<void> {
  const allProducts = await getAllProducts();

  for (const item of items) {
    let targetProduct: Product | undefined;

    const normItemSize = normalizeString(item.size);
    const normItemColor = normalizeString(item.color);
    const normItemName = normalizeString(item.name).replace(/-\d+.*$/, "");

    // 1. Match by sourceId first if available
    if (item.sourceId) {
      targetProduct = allProducts.find((p) => p.id === item.sourceId);
    }

    // 2. If sourceId doesn't match current size/color, search all products by normalized name, size & color
    if (item.name) {
      const matchedByName = allProducts.filter((p) => {
        const normPName = normalizeString(p.name).replace(/-\d+.*$/, "");
        return normPName.includes(normItemName) || normItemName.includes(normPName);
      });

      if (matchedByName.length > 0) {
        // Match exact normalized size AND color
        const exactSizeAndColorMatch = matchedByName.find((p) => {
          const pSize = normalizeString(p.size);
          const pColor = normalizeString(p.color);
          const sizeOk = !normItemSize || pSize === normItemSize;
          const colorOk = !normItemColor || pColor === normItemColor;
          return sizeOk && colorOk;
        });

        if (exactSizeAndColorMatch) {
          targetProduct = exactSizeAndColorMatch;
        } else {
          // Match exact normalized size
          const exactSizeMatch = matchedByName.find((p) => {
            const pSize = normalizeString(p.size);
            return normItemSize && pSize === normItemSize;
          });

          if (exactSizeMatch) {
            targetProduct = exactSizeMatch;
          } else if (!targetProduct) {
            targetProduct = matchedByName[0];
          }
        }
      }
    }

    if (!targetProduct) {
      console.warn(`Product not found in stock for deduction: ${item.name}`);
      continue;
    }

    const newQuantity = Math.max(0, targetProduct.stockQuantity - item.quantity);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetProduct.id);

    if (updateError) {
      throw new Error(
        `Failed to reduce stock for product ${targetProduct.id}: ${updateError.message}`
      );
    }
  }
}

export async function getLowStockProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
}
