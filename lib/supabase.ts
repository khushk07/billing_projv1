import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

/**
 * Server-side Supabase client using the service role key.
 * Bypasses Row Level Security — only use in API routes / server code.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
