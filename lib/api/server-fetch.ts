import "server-only";
import { headers } from "next/headers";

export type ApiFetchResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status: number;
      error: {
        code: string;
        message: string;
      };
    };

export function getOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function fetchInternalApi<T>(path: string, init: RequestInit = {}): Promise<ApiFetchResult<T>> {
  const headerStore = await headers();
  const response = await fetch(`${getOrigin(headerStore)}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    headers: {
      ...init.headers,
      cookie: headerStore.get("cookie") ?? ""
    }
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: {
      code?: string;
      message?: string;
    };
  };

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: {
        code: payload.error?.code ?? "api_error",
        message: payload.error?.message ?? "The request could not be completed."
      }
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload as T
  };
}

