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
        details?: unknown;
      };
    };

export function getOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
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
  const responseText = await response.text();
  const payload = parseResponsePayload(responseText) as T & {
    error?: {
      code?: string;
      message?: string;
      details?: unknown;
    };
  };

  if (!response.ok) {
    const fallbackMessage = `Request to ${path} failed with HTTP ${response.status}${
      responseText ? `: ${truncateForMessage(responseText)}` : "."
    }`;

    console.error("Internal API request failed.", {
      path,
      status: response.status,
      statusText: response.statusText,
      payload,
      responseText: truncateForLog(responseText)
    });

    return {
      ok: false,
      status: response.status,
      error: {
        code: payload.error?.code ?? "api_error",
        message: payload.error?.message ?? fallbackMessage,
        details: payload.error?.details
      }
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload as T
  };
}

function parseResponsePayload(responseText: string) {
  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

function truncateForLog(value: string, maxLength = 4000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}... [truncated]` : value;
}

function truncateForMessage(value: string, maxLength = 600) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}
