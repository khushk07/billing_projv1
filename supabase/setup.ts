// Quick setup script: creates tables + seeds data
// Usage: npx tsx supabase/setup.ts

const SUPABASE_URL = "https://octccgufztzwwoszdbwd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGNjZ3VmenR6d3dvc3pkYndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk0MDUyMiwiZXhwIjoyMDk2NTE2NTIyfQ.T7bUB7OBGkpkfbdwxrM8rbku4_KkB2mWK2aeEWVcjfU";

import fs from "fs/promises";
import path from "path";

async function runSQL(sql: string) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  // ── Step 1: Create tables ──
  console.log("📦 Creating tables…\n");
  const schema = await fs.readFile(path.join(process.cwd(), "supabase", "schema.sql"), "utf-8");
  
  // Split by semicolons and run each statement
  const statements = schema
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").substring(0, 70);
    try {
      await runSQL(stmt + ";");
      console.log(`  ✅ ${preview}…`);
    } catch (err: any) {
      console.error(`  ❌ ${preview}… → ${err.message}`);
    }
  }

  // ── Step 2: Seed data ──
  console.log("\n🌱 Seeding data…\n");

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const DATA_DIR = path.join(process.cwd(), "data");

  async function readJson(file: string) {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  // Customers
  const customers = await readJson("customers.json");
  if (customers.length) {
    const rows = customers.map((c: any) => ({
      id: c.id, name: c.name, phone: c.phone,
      total_visits: c.totalVisits, total_spent: c.totalSpent,
      last_purchase_date: c.lastPurchaseDate,
      categories_bought: c.categoriesBought ?? [],
      sales_ids: c.salesIds ?? [],
      created_at: c.createdAt, updated_at: c.updatedAt,
    }));
    const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
    console.log(error ? `  ❌ Customers: ${error.message}` : `  ✅ Customers: ${rows.length}`);
  }

  // Sales
  const sales = await readJson("sales.json");
  if (sales.length) {
    const saleRows = sales.map((s: any) => ({
      id: s.id, bill_number: s.billNumber, customer_id: s.customerId,
      customer_name: s.customerName, customer_phone: s.customerPhone,
      grand_total: s.grandTotal, created_at: s.createdAt,
    }));
    const { error } = await supabase.from("sales").upsert(saleRows, { onConflict: "id" });
    console.log(error ? `  ❌ Sales: ${error.message}` : `  ✅ Sales: ${saleRows.length}`);

    if (!error) {
      const items: any[] = [];
      for (const s of sales) {
        for (const i of s.items ?? []) {
          items.push({
            sale_id: s.id, name: i.name, subcategory: i.subcategory,
            category: i.category, quantity: i.quantity, unit_price: i.unitPrice,
            line_total: i.lineTotal, source: i.source, source_id: i.sourceId ?? null,
          });
        }
      }
      if (items.length) {
        const { error: ie } = await supabase.from("sale_items").insert(items);
        console.log(ie ? `  ❌ Sale items: ${ie.message}` : `  ✅ Sale items: ${items.length}`);
      }
    }
  }

  // Stock log
  const stocklog = await readJson("stocklog.json");
  if (stocklog.length) {
    const rows = stocklog.map((e: any) => ({
      id: e.id, name: e.name, category: e.category, subcategory: e.subcategory,
      approx_price: e.approxPrice, quantity: e.quantity, source: e.source,
      last_used_price: e.lastUsedPrice, times_used: e.timesUsed,
      promoted_to_catalogue: e.promotedToCatalogue ?? false,
      created_at: e.createdAt, updated_at: e.updatedAt,
    }));
    const { error } = await supabase.from("stock_log").upsert(rows, { onConflict: "id" });
    console.log(error ? `  ❌ Stock log: ${error.message}` : `  ✅ Stock log: ${rows.length}`);
  }

  // Products
  const products = await readJson("inventory.json");
  if (products.length) {
    const rows = products.map((p: any) => ({
      id: p.id, name: p.name, category: p.category, subcategory: p.subcategory,
      variant: p.variant ?? null, selling_price: p.sellingPrice,
      stock_quantity: p.stockQuantity, low_stock_threshold: p.lowStockThreshold,
      created_at: p.createdAt, updated_at: p.updatedAt,
    }));
    const { error } = await supabase.from("products").upsert(rows, { onConflict: "id" });
    console.log(error ? `  ❌ Products: ${error.message}` : `  ✅ Products: ${rows.length}`);
  }

  console.log("\n🎉 Setup complete!");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
