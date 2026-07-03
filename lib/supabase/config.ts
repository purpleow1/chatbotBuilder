const SUPABASE_URL_ENV = "SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

export class SupabaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required Supabase environment variables: ${missing.join(", ")}`);
    this.name = "SupabaseConfigError";
  }
}

function getSupabasePublicKey() {
  return process.env[SUPABASE_PUBLISHABLE_KEY_ENV] || "";
}

function getSupabaseProjectUrl() {
  const configuredUrl = process.env[SUPABASE_URL_ENV] || "";

  if (!configuredUrl) {
    return "";
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return configuredUrl;
  }
}

export function getMissingSupabaseAuthEnv() {
  const missing: string[] = [];

  if (!process.env[SUPABASE_URL_ENV]) {
    missing.push(SUPABASE_URL_ENV);
  }

  if (!getSupabasePublicKey()) {
    missing.push(SUPABASE_PUBLISHABLE_KEY_ENV);
  }

  return missing;
}

export function getMissingSupabaseServiceEnv() {
  return [SUPABASE_URL_ENV, SUPABASE_SERVICE_ROLE_KEY_ENV].filter((key) => !process.env[key]);
}

export function getSupabasePublicConfig() {
  const missing = getMissingSupabaseAuthEnv();

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return {
    url: getSupabaseProjectUrl(),
    key: getSupabasePublicKey()
  };
}

export function getSupabaseServiceConfig() {
  const missing = getMissingSupabaseServiceEnv();

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return {
    url: getSupabaseProjectUrl(),
    key: process.env[SUPABASE_SERVICE_ROLE_KEY_ENV]!
  };
}
