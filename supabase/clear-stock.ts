import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import ws from "ws";

(globalThis as any).WebSocket = ws;

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://octccgufztzwwoszdbwd.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGNjZ3VmenR6d3dvc3pkYndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk0MDUyMiwiZXhwIjoyMDk2NTE2NTIyfQ.T7bUB7OBGkpkfbdwxrM8rbku4_KkB2mWK2aeEWVcjfU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("🧹 Clearing products and stock_log data from Supabase...");

  // 1. Delete stock_log entries
  const { error: stocklogErr } = await supabase.from("stock_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (stocklogErr) {
    console.error("❌ Error clearing stock_log:", stocklogErr.message);
  } else {
    console.log("✅ `stock_log` table cleared");
  }

  // 2. Delete products entries
  const { error: prodErr } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (prodErr) {
    console.error("❌ Error clearing products:", prodErr.message);
  } else {
    console.log("✅ `products` table cleared");
  }

  // 3. Clear local JSON data files
  const dataDir = path.join(process.cwd(), "data");
  await fs.writeFile(path.join(dataDir, "inventory.json"), JSON.stringify([], null, 2));
  await fs.writeFile(path.join(dataDir, "stocklog.json"), JSON.stringify([], null, 2));
  console.log("✅ Local `data/inventory.json` and `data/stocklog.json` reset");

  console.log("\n✨ Stock data cleanup complete! Customers and Sales history preserved.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
