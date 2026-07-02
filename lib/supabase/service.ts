import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

const REQUIRED_SUPABASE_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export class SupabaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required Supabase environment variables: ${missing.join(", ")}`);
    this.name = "SupabaseConfigError";
  }
}

export function getMissingSupabaseEnv() {
  return REQUIRED_SUPABASE_ENV.filter((key) => !process.env[key]);
}

export function getSupabaseServiceClient() {
  const missing = getMissingSupabaseEnv();

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
