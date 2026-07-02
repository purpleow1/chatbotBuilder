import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { botMutationSchema } from "@/lib/api/bot-validation";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { createBotForWorkspace, getBotCapacity, listBotsForWorkspace } from "@/lib/db/bots";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

function validationError(error: ZodError) {
  return new ApiError(400, error.issues[0]?.message ?? "Bot settings are invalid.", "invalid_bot_settings");
}

export async function GET(request: NextRequest) {
  try {
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const [bots, capacity] = await Promise.all([
      listBotsForWorkspace(account.activeWorkspace.id),
      getBotCapacity(account.activeWorkspace.id)
    ]);
    const response = NextResponse.json({ bots, capacity });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const input = botMutationSchema.safeParse(await request.json().catch(() => null));

    if (!input.success) {
      throw validationError(input.error);
    }

    const bot = await createBotForWorkspace(account.activeWorkspace.id, user.id, input.data);
    const response = NextResponse.json({ bot }, { status: 201 });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

