import "server-only";
import type { User } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/errors";
import type { SubscriptionPlan, SubscriptionStatus, WorkspaceRole } from "@/lib/db/database.types";
import { listWorkspacesForUser } from "@/lib/db/workspaces";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AccountWorkspace = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  role: WorkspaceRole;
  joined_at: string;
};

export type AccountSubscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  bot_limit: number;
  document_limit: number;
  monthly_message_limit: number;
  current_period_end: string;
};

export type AccountContext = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    initials: string;
  };
  workspaces: AccountWorkspace[];
  activeWorkspace: AccountWorkspace;
  subscription: AccountSubscription;
};

function getMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function titleCase(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

function getFallbackWorkspaceName(email: string) {
  const domain = email.split("@")[1]?.split(".")[0];

  if (!domain) {
    return "My Workspace";
  }

  return `${titleCase(domain)} Support`;
}

function getPreferredWorkspaceName(user: User, email: string) {
  return getMetadataString(user, "workspace_name") ?? getFallbackWorkspaceName(email);
}

function getUserInitials(fullName: string | null, email: string) {
  const source = fullName ?? email.split("@")[0] ?? "User";
  const initials = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

async function upsertApplicationUser(user: User) {
  const email = user.email?.trim();

  if (!email) {
    throw new ApiError(400, "The authenticated user does not have an email address.", "missing_user_email");
  }

  const fullName = getMetadataString(user, "full_name") ?? getMetadataString(user, "name");
  const avatarUrl = getMetadataString(user, "avatar_url");
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return {
    email,
    fullName
  };
}

async function createDefaultWorkspace(user: User, email: string) {
  const supabase = getSupabaseServiceClient();
  const workspaceName = getPreferredWorkspaceName(user, email).slice(0, 80);
  const workspaceSlug = `${slugify(workspaceName)}-${user.id.slice(0, 8)}`;
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: workspaceName,
      slug: workspaceSlug,
      created_by: user.id
    })
    .select("id, name, slug, created_by, created_at, updated_at")
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: membershipError } = await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
      status: "active"
    },
    { onConflict: "workspace_id,user_id" }
  );

  if (membershipError) {
    throw membershipError;
  }

  return workspace.id;
}

async function getOrCreateSubscription(workspaceId: string): Promise<AccountSubscription> {
  const supabase = getSupabaseServiceClient();
  const selectColumns = "plan, status, bot_limit, document_limit, monthly_message_limit, current_period_end";
  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select(selectColumns)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ workspace_id: workspaceId })
    .select(selectColumns)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureAccountForUser(user: User): Promise<AccountContext> {
  const { email, fullName } = await upsertApplicationUser(user);
  let workspaces = (await listWorkspacesForUser(user.id)) as AccountWorkspace[];

  if (workspaces.length === 0) {
    await createDefaultWorkspace(user, email);
    workspaces = (await listWorkspacesForUser(user.id)) as AccountWorkspace[];
  }

  const activeWorkspace = workspaces[0];

  if (!activeWorkspace) {
    throw new ApiError(500, "Could not create a workspace for this account.", "workspace_onboarding_failed");
  }

  const subscription = await getOrCreateSubscription(activeWorkspace.id);

  return {
    user: {
      id: user.id,
      email,
      fullName,
      initials: getUserInitials(fullName, email)
    },
    workspaces,
    activeWorkspace,
    subscription
  };
}
