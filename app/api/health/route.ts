import { NextResponse } from "next/server";
import { getMissingSupabaseAuthEnv } from "@/lib/supabase/config";
import { getMissingSupabaseEnv, getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function checkServiceDatabase() {
  const missingSupabaseServiceEnv = getMissingSupabaseEnv();

  if (missingSupabaseServiceEnv.length > 0) {
    return {
      ok: false,
      checked: false,
      message: "Supabase service env vars are missing."
    };
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("users").select("id", { count: "exact", head: true }).limit(1);

  if (!error) {
    return {
      ok: true,
      checked: true,
      message: "Service-role database access is working."
    };
  }

  return {
    ok: false,
    checked: true,
    message: "Service-role database access failed.",
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    }
  };
}

export async function GET() {
  const missingSupabaseServiceEnv = getMissingSupabaseEnv();
  const missingSupabaseAuthEnv = getMissingSupabaseAuthEnv();
  const database = await checkServiceDatabase();
  const configured =
    missingSupabaseServiceEnv.length === 0 && missingSupabaseAuthEnv.length === 0 && database.ok;

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
      database,
      dataAccess: {
        boundary: "REST API routes",
        supabaseClient: "server service role only",
        rls: "not used for MVP CRUD access"
      }
    },
    { status: configured ? 200 : 503 }
  );
}
