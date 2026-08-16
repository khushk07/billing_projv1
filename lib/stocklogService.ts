import { supabase } from "@/lib/supabase";
import type { StockLogItem, StockLogSource } from "@/types";

const TABLE = "stock_log";

// ─── Mappers ────────────────────────────────────────────────────────────────

/** DB row → TypeScript StockLogItem */
function toStockLogItem(row: Record<string, unknown>): StockLogItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    approxPrice: row.approx_price as number,
    quantity: row.quantity as number,
    source: row.source as StockLogSource,
    lastUsedPrice: row.last_used_price as number,
    timesUsed: row.times_used as number,
    promotedToCatalogue: row.promoted_to_catalogue as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    hsnCode: (row.hsn_code as string) ?? undefined,
    gstPercentage: (row.gst_percentage as number) ?? undefined,
  };
}

/** TypeScript insert payload → DB row (snake_case) */
function toDbInsert(input: {
  name: string;
  category: string;
  subcategory: string;
  approxPrice: number;
  quantity: number;
  source: StockLogSource | string;
  lastUsedPrice?: number;
  timesUsed?: number;
  hsnCode?: string;
  gstPercentage?: number;
}): Record<string, unknown> {
  return {
    name: input.name,
    category: input.category,
    subcategory: input.subcategory,
    approx_price: input.approxPrice,
    quantity: input.quantity,
    source: input.source,
    last_used_price: input.lastUsedPrice ?? input.approxPrice,
    times_used: input.timesUsed ?? 0,
    promoted_to_catalogue: false,
    hsn_code: input.hsnCode ?? null,
    gst_percentage: input.gstPercentage ?? null,
  };
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Returns active (non-promoted) stock log entries.
 */
export async function getActiveStockLog(): Promise<StockLogItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("promoted_to_catalogue", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch active stock log: ${error.message}`);
  return (data ?? []).map(toStockLogItem);
}

/**
 * Returns all stock log entries including promoted.
 */
export async function getAllStockLog(): Promise<StockLogItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch all stock log: ${error.message}`);
  return (data ?? []).map(toStockLogItem);
}

/**
 * Adds a stock log entry.
 */
export async function addStockLogEntry(
  input: Omit<
    StockLogItem,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "promotedToCatalogue"
    | "timesUsed"
    | "lastUsedPrice"
  > & { lastUsedPrice?: number; timesUsed?: number }
): Promise<StockLogItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toDbInsert(input))
    .select()
    .single();

  if (error) throw new Error(`Failed to add stock log entry: ${error.message}`);
  return toStockLogItem(data);
}

/**
 * Bulk import stock log lines.
 */
export async function bulkImportStockLog(
  lines: { name: string; approxPrice: number; quantity: number }[],
  defaultCategory: string,
  defaultSubcategory: string
): Promise<StockLogItem[]> {
  if (lines.length === 0) return [];

  const rows = lines.map((line) =>
    toDbInsert({
      name: line.name,
      category: defaultCategory,
      subcategory: defaultSubcategory,
      approxPrice: line.approxPrice,
      quantity: line.quantity,
      source: "bulk-import",
    })
  );

  const { data, error } = await supabase
    .from(TABLE)
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to bulk import stock log: ${error.message}`);
  return (data ?? []).map(toStockLogItem);
}

/**
 * Marks stock log entry as promoted to catalogue.
 */
export async function promoteStockLogEntry(
  id: string
): Promise<StockLogItem | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      promoted_to_catalogue: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to promote stock log entry: ${error.message}`);
  return data ? toStockLogItem(data) : null;
}

/**
 * Updates timesUsed and lastUsedPrice after billing.
 */
export async function updateStockLogUsage(
  items: {
    sourceId?: string;
    unitPrice: number;
    quantity: number;
    source: string;
  }[]
): Promise<void> {
  const stocklogItems = items.filter(
    (item) => item.source === "stocklog" && item.sourceId
  );

  for (const item of stocklogItems) {
    // Fetch current times_used and quantity
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE)
      .select("times_used, quantity")
      .eq("id", item.sourceId!)
      .single();

    if (fetchError || !existing) continue;

    const newTimesUsed = (existing.times_used as number) + 1;
    // Deduct quantity from stock log as well (ensuring it doesn't fall below 0)
    const newQuantity = Math.max(0, (existing.quantity as number) - item.quantity);

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({
        times_used: newTimesUsed,
        quantity: newQuantity,
        last_used_price: item.unitPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.sourceId!);

    if (updateError) {
      throw new Error(
        `Failed to update stock log usage for ${item.sourceId}: ${updateError.message}`
      );
    }
  }
}

/**
 * Finds stock log entry by name (case-insensitive) for billing learnings.
 */
export async function findStockLogByName(
  name: string
): Promise<StockLogItem | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .ilike("name", name.trim())
    .eq("promoted_to_catalogue", false)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to find stock log by name: ${error.message}`);
  return data ? toStockLogItem(data) : undefined;
}
