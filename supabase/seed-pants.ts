import { createClient } from "@supabase/supabase-js";
import { HIKING_PANTS_MODELS, HIKING_PANTS_SIZES, getHikingPantsPrice } from "../lib/categories";
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
  console.log("🌱 Populating Hiking Pants variants into Supabase...");

  const now = new Date().toISOString();
  const productsToInsert: any[] = [];

  for (const model of HIKING_PANTS_MODELS) {
    for (const size of HIKING_PANTS_SIZES) {
      const price = getHikingPantsPrice(model, size) ?? 1500;
      productsToInsert.push({
        name: `${model} - ${size}`,
        category: "Hiking Gears",
        subcategory: "Hiking Pants",
        variant: size,
        selling_price: price,
        stock_quantity: 10, // Initial stock count per size variant
        low_stock_threshold: 3,
        hsn_code: "620319",
        gst_percentage: 5,
        created_at: now,
        updated_at: now,
      });
    }
  }

  console.log(`📦 Inserting ${productsToInsert.length} product variants...`);

  // Insert in batches of 50
  for (let i = 0; i < productsToInsert.length; i += 50) {
    const batch = productsToInsert.slice(i, i + 50);
    const { error } = await supabase.from("products").insert(batch);
    if (error) {
      console.error(`❌ Error inserting batch ${i}:`, error.message);
    }
  }

  console.log("✅ Successfully populated all Hiking Pants variants into Supabase!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
