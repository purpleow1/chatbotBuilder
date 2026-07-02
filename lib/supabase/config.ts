const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";
const SUPABASE_PUBLIC_KEY_LABEL = `${SUPABASE_PUBLISHABLE_KEY_ENV} or ${SUPABASE_ANON_KEY_ENV}`;

export class SupabaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required Supabase environment variables: ${missing.join(", ")}`);
    this.name = "SupabaseConfigError";
  }
}

function getSupabasePublicKey() {
  return process.env[SUPABASE_PUBLISHABLE_KEY_ENV] || process.env[SUPABASE_ANON_KEY_ENV] || "";
}

export function getMissingSupabaseAuthEnv() {
  const missing: string[] = [];

  if (!process.env[SUPABASE_URL_ENV]) {
    missing.push(SUPABASE_URL_ENV);
  }

  if (!getSupabasePublicKey()) {
    missing.push(SUPABASE_PUBLIC_KEY_LABEL);
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
    url: process.env[SUPABASE_URL_ENV]!,
    key: getSupabasePublicKey()
  };
}
