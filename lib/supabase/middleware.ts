import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/db/database.types";
import { getMissingSupabaseAuthEnv, getSupabasePublicConfig } from "@/lib/supabase/config";

type AuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function applyCookies(response: NextResponse, cookiesToSet: AuthCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function updateAuthSession(request: NextRequest) {
  const missingAuthEnv = getMissingSupabaseAuthEnv();

  if (missingAuthEnv.length > 0) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const cookiesToSet: AuthCookie[] = [];
  const { url, key } = getSupabasePublicConfig();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items: AuthCookie[]) {
        items.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.push(...items);
        response = NextResponse.next({ request });
      }
    }
  });

  const { data: claimsData, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(claimsData?.claims.sub);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/app") && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return applyCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
  }

  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return applyCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
  }

  return applyCookies(response, cookiesToSet);
}
