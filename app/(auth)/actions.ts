"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeNextPath, withQuery } from "@/lib/auth/redirects";
import { getMissingSupabaseAuthEnv } from "@/lib/supabase/config";
import { getSupabaseServerAuthClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional()
});

const signupSchema = z.object({
  workspaceName: z.string().trim().min(2, "Enter a workspace name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Use at least 6 characters."),
  next: z.string().optional()
});

function getFormString(formData: FormData, key: string) {
  const exactValue = formData.get(key);

  if (typeof exactValue === "string") {
    return exactValue;
  }

  const scopedEntry = Array.from(formData.entries()).find(([entryKey]) => entryKey.endsWith(`_${key}`));
  const value = scopedEntry?.[1];

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(pathname: string, params: Record<string, string | null | undefined>): never {
  redirect(withQuery(pathname, params) as Route);
}

function getAuthConfigError() {
  const missing = getMissingSupabaseAuthEnv();

  if (missing.length === 0) {
    return null;
  }

  return `Supabase Auth is not configured. Add ${missing.join(", ")} to .env.local.`;
}

function getAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function getAuthConfirmUrl(nextPath: string) {
  const url = new URL("/auth/confirm", getAppOrigin());

  url.searchParams.set("next", nextPath);

  return url.toString();
}

function getAuthErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function getAuthErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return undefined;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

function getSignupErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error);

  switch (code) {
    case "email_address_not_authorized":
      return "Supabase refused to send a confirmation email to this address. Add the address to your Supabase project team, disable email confirmations for local testing, or configure custom SMTP.";
    case "email_address_invalid":
      return "Supabase rejected that email address. Try a different address.";
    case "email_exists":
    case "user_already_exists":
      return "An account with that email may already exist. Try logging in instead.";
    case "signup_disabled":
    case "email_provider_disabled":
    case "provider_disabled":
      return "Email/password signup is disabled in Supabase. Enable the Email provider in Authentication settings.";
    case "weak_password":
      return message ?? "Use a stronger password for this Supabase project.";
    case "over_email_send_rate_limit":
      return "Supabase email sending is rate limited. Wait a bit, then try again.";
    case "over_request_rate_limit":
      return "Supabase is rate limiting signup attempts. Wait a bit, then try again.";
    case "validation_failed":
      return message ?? "Supabase rejected the signup request.";
    default:
      if (process.env.NODE_ENV !== "production" && message) {
        return `Supabase signup failed${code ? ` (${code})` : ""}: ${message}`;
      }

      return "We could not create that account. Try logging in if it already exists.";
  }
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    next: getFormString(formData, "next")
  });
  const nextPath = getSafeNextPath(getFormString(formData, "next"));

  if (!parsed.success) {
    redirectWithMessage("/login", {
      error: parsed.error.issues[0]?.message ?? "Check your login details.",
      next: nextPath
    });
  }

  const configError = getAuthConfigError();

  if (configError) {
    redirectWithMessage("/login", { error: configError, next: nextPath });
  }

  const supabase = await getSupabaseServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirectWithMessage("/login", {
      error: "We could not log you in with those credentials.",
      next: nextPath
    });
  }

  revalidatePath("/", "layout");
  redirect(nextPath as Route);
}

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    workspaceName: getFormString(formData, "workspaceName"),
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    next: getFormString(formData, "next")
  });
  const nextPath = getSafeNextPath(getFormString(formData, "next"));

  if (!parsed.success) {
    redirectWithMessage("/signup", {
      error: parsed.error.issues[0]?.message ?? "Check your signup details.",
      next: nextPath
    });
  }

  const configError = getAuthConfigError();

  if (configError) {
    redirectWithMessage("/signup", { error: configError, next: nextPath });
  }

  const supabase = await getSupabaseServerAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        workspace_name: parsed.data.workspaceName
      },
      emailRedirectTo: getAuthConfirmUrl(nextPath)
    }
  });

  if (error) {
    console.error("Supabase signup failed", {
      code: getAuthErrorCode(error),
      status: "status" in error ? error.status : undefined,
      message: error.message
    });
    redirectWithMessage("/signup", {
      error: getSignupErrorMessage(error),
      next: nextPath
    });
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect(nextPath as Route);
  }

  redirectWithMessage("/login", {
    message: "Check your email to confirm your account, then log in.",
    next: nextPath
  });
}
