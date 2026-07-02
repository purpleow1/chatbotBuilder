"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function getSupabaseBrowserAuthClient() {
  const { url, key } = getSupabasePublicConfig();

  return createBrowserClient<Database>(url, key);
}
