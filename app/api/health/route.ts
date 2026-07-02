import { NextResponse } from "next/server";
import { getMissingSupabaseAuthEnv } from "@/lib/supabase/config";
import { getMissingSupabaseEnv } from "@/lib/supabase/service";

export const runtime = "nodejs";

export function GET() {
  const missingSupabaseServiceEnv = getMissingSupabaseEnv();
  const missingSupabaseAuthEnv = getMissingSupabaseAuthEnv();
  const configured = missingSupabaseServiceEnv.length === 0 && missingSupabaseAuthEnv.length === 0;

  return NextResponse.json(
    {
      ok: configured,
      supabase: {
        configured,
        authConfigured: missingSupabaseAuthEnv.length === 0,
        serviceConfigured: missingSupabaseServiceEnv.length === 0,
        missingAuthEnv: missingSupabaseAuthEnv,
        missingServiceEnv: missingSupabaseServiceEnv
      },
      dataAccess: {
        boundary: "REST API routes",
        supabaseClient: "server service role only",
        rls: "not used for MVP CRUD access"
      }
    },
    { status: configured ? 200 : 503 }
  );
}
