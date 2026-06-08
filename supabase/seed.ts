/**
 * One-time seed script: creates tables via SQL, then migrates existing JSON data
 * into Supabase.
 *
 * Usage:  npx tsx supabase/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://octccgufztzwwoszdbwd.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGNjZ3VmenR6d3dvc3pkYndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk0MDUyMiwiZXhwIjoyMDk2NTE2NTIyfQ.T7bUB7OBGkpkfbdwxrM8rbku4_KkB2mWK2aeEWVcjfU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("🚀 Starting Supabase seed…\n");

  // ── 1. Seed customers ────────────────────────────────────
  const customers = await readJson<any>("customers.json");
  if (customers.length) {
    console.log(`  Customers: ${customers.length} records`);
    const rows = customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      total_visits: c.totalVisits,
      total_spent: c.totalSpent,
      last_purchase_date: c.lastPurchaseDate,
      categories_bought: c.categoriesBought ?? [],
      sales_ids: c.salesIds ?? [],
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));
    const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("  ❌ Customers error:", error.message);
    } else {
      console.log("  ✅ Customers seeded");
    }
  } else {
    console.log("  Customers: 0 records (skipped)");
  }

  // ── 2. Seed sales + sale_items ───────────────────────────
  const sales = await readJson<any>("sales.json");
  if (sales.length) {
    console.log(`  Sales: ${sales.length} records`);
    const saleRows = sales.map((s: any) => ({
      id: s.id,
      bill_number: s.billNumber,
      customer_id: s.customerId,
      customer_name: s.customerName,
      customer_phone: s.customerPhone,
      grand_total: s.grandTotal,
      created_at: s.createdAt,
    }));
    const { error: saleErr } = await supabase.from("sales").upsert(saleRows, { onConflict: "id" });
    if (saleErr) {
      console.error("  ❌ Sales error:", saleErr.message);
    } else {
      console.log("  ✅ Sales seeded");

      // Insert sale items
      const allItems: any[] = [];
      for (const s of sales) {
        for (const item of s.items ?? []) {
          allItems.push({
            sale_id: s.id,
            name: item.name,
            subcategory: item.subcategory,
            category: item.category,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.lineTotal,
            source: item.source,
            source_id: item.sourceId ?? null,
          });
        }
      }
      if (allItems.length) {
        const { error: itemsErr } = await supabase.from("sale_items").insert(allItems);
        if (itemsErr) {
          console.error("  ❌ Sale items error:", itemsErr.message);
        } else {
          console.log(`  ✅ Sale items seeded (${allItems.length} items)`);
        }
      }
    }
  } else {
    console.log("  Sales: 0 records (skipped)");
  }

  // ── 3. Seed stock log ────────────────────────────────────
  const stocklog = await readJson<any>("stocklog.json");
  if (stocklog.length) {
    console.log(`  Stock log: ${stocklog.length} records`);
    const rows = stocklog.map((e: any) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      subcategory: e.subcategory,
      approx_price: e.approxPrice,
      quantity: e.quantity,
      source: e.source,
      last_used_price: e.lastUsedPrice,
      times_used: e.timesUsed,
      promoted_to_catalogue: e.promotedToCatalogue ?? false,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    }));
    const { error } = await supabase.from("stock_log").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("  ❌ Stock log error:", error.message);
    } else {
      console.log("  ✅ Stock log seeded");
    }
  } else {
    console.log("  Stock log: 0 records (skipped)");
  }

  // ── 4. Seed products (inventory) ─────────────────────────
  const products = await readJson<any>("inventory.json");
  if (products.length) {
    console.log(`  Products: ${products.length} records`);
    const rows = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      variant: p.variant ?? null,
      selling_price: p.sellingPrice,
      stock_quantity: p.stockQuantity,
      low_stock_threshold: p.lowStockThreshold,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
    const { error } = await supabase.from("products").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("  ❌ Products error:", error.message);
    } else {
      console.log("  ✅ Products seeded");
    }
  } else {
    console.log("  Products: 0 records (skipped)");
  }

  console.log("\n🎉 Seed complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
