import "server-only";
import type { User } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function requireAuthenticatedUser(request: Request): Promise<User> {
  const token = getBearerToken(request);

  if (!token) {
    throw new ApiError(401, "Missing bearer token.", "missing_auth_token");
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, "Invalid or expired bearer token.", "invalid_auth_token");
  }

  return data.user;
}
