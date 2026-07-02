import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import type { Database } from "@/lib/db/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type AuthenticatedRequest = {
  user: User;
  cookiesToSet: AuthCookie[];
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function getUserFromBearerToken(token: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, "Invalid or expired bearer token.", "invalid_auth_token");
  }

  return data.user;
}

async function getUserFromCookies(request: NextRequest): Promise<AuthenticatedRequest> {
  const cookiesToSet: AuthCookie[] = [];
  const { url, key } = getSupabasePublicConfig();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items: AuthCookie[]) {
        cookiesToSet.push(...items);
      }
    }
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ApiError(401, "You need to log in to continue.", "unauthenticated");
  }

  return {
    user: data.user,
    cookiesToSet
  };
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest> {
  const token = getBearerToken(request);

  if (token) {
    return {
      user: await getUserFromBearerToken(token),
      cookiesToSet: []
    };
  }

  return getUserFromCookies(request);
}

export async function requireAuthenticatedUser(request: NextRequest): Promise<User> {
  const { user } = await authenticateRequest(request);

  return user;
}

export function applyAuthCookies(response: NextResponse, cookiesToSet: AuthCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
