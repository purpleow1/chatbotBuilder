import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { requireAuthenticatedUser } from "@/lib/db/auth";
import { listWorkspacesForUser } from "@/lib/db/workspaces";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const workspaces = await listWorkspacesForUser(user.id);

    return NextResponse.json({ workspaces });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
