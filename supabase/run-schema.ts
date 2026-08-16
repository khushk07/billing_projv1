/**
 * Runs the schema.sql against Supabase using the Management API.
 * Usage: npx tsx supabase/run-schema.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const SUPABASE_URL = "https://octccgufztzwwoszdbwd.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGNjZ3VmenR6d3dvc3pkYndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk0MDUyMiwiZXhwIjoyMDk2NTE2NTIyfQ.T7bUB7OBGkpkfbdwxrM8rbku4_KkB2mWK2aeEWVcjfU";

async function main() {
  const sql = await fs.readFile(
    path.join(process.cwd(), "supabase", "schema.sql"),
    "utf-8"
  );

  console.log("📦 Running schema SQL against Supabase…\n");

  // Use the pg-meta REST endpoint to run raw SQL
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  // If the RPC endpoint doesn't work, try the SQL endpoint directly
  if (!res.ok) {
    console.log("RPC endpoint not available, using direct SQL endpoint…");

    // Split into individual statements and run them via pg functions
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Try using the supabase-js query method
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      console.log(`  Running: ${stmt.substring(0, 60)}…`);
      const { error } = await supabase.rpc("exec_sql", { sql_string: stmt + ";" });
      if (error) {
        // If exec_sql doesn't exist, we'll need to use the SQL editor
        console.error(`  ⚠️  Error: ${error.message}`);
      }
    }
  } else {
    console.log("✅ Schema created successfully!");
  }
}

main().catch(console.error);
