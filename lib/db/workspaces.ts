import "server-only";
import { ApiError } from "@/lib/api/errors";
import type { WorkspaceRole } from "@/lib/db/database.types";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type WorkspaceMembership = {
  workspaceId: string;
  role: WorkspaceRole;
};

export async function getActiveWorkspaceMembership(userId: string, workspaceId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    workspaceId: data.workspace_id,
    role: data.role
  } satisfies WorkspaceMembership;
}

export async function requireWorkspaceMembership(userId: string, workspaceId: string) {
  const membership = await getActiveWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    throw new ApiError(403, "You do not have access to this workspace.", "workspace_forbidden");
  }

  return membership;
}

export async function listWorkspacesForUser(userId: string) {
  const supabase = getSupabaseServiceClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, joined_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (membershipError) {
    throw membershipError;
  }

  if (memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_by, created_at, updated_at")
    .in("id", workspaceIds);

  if (workspaceError) {
    throw workspaceError;
  }

  return memberships.flatMap((membership) => {
    const workspace = workspaces.find((item) => item.id === membership.workspace_id);

    if (!workspace) {
      return [];
    }

    return [
      {
        ...workspace,
        role: membership.role,
        joined_at: membership.joined_at
      }
    ];
  });
}
