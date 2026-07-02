import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { getMissingSupabaseServiceEnv, getSupabaseServiceConfig, SupabaseConfigError } from "@/lib/supabase/config";

export { SupabaseConfigError };

export function getMissingSupabaseEnv() {
  return getMissingSupabaseServiceEnv();
}

export function getSupabaseServiceClient() {
  const { url, key } = getSupabaseServiceConfig();

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
