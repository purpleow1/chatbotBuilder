import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { botUpdateSchema } from "@/lib/api/bot-validation";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { deleteBotForWorkspace, getBotForWorkspace, updateBotForWorkspace } from "@/lib/db/bots";
import { ensureAccountForUser } from "@/lib/db/onboarding";
import { applyWidgetPlanLimits, normalizeWidgetSettings } from "@/lib/widget/settings";

export const runtime = "nodejs";

function validationError(error: ZodError) {
  return new ApiError(400, error.issues[0]?.message ?? "Bot settings are invalid.", "invalid_bot_settings");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const bot = await getBotForWorkspace(account.activeWorkspace.id, botId);
    const response = NextResponse.json({ bot, subscription: account.subscription });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const input = botUpdateSchema.safeParse(await request.json().catch(() => null));

    if (!input.success) {
      throw validationError(input.error);
    }

    const botInput = {
      ...input.data,
      widgetSettings:
        input.data.widgetSettings === undefined
          ? undefined
          : applyWidgetPlanLimits(normalizeWidgetSettings(input.data.widgetSettings, input.data.name), account.subscription.plan)
    };
    const bot = await updateBotForWorkspace(account.activeWorkspace.id, botId, botInput);
    const response = NextResponse.json({ bot });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);

    await deleteBotForWorkspace(account.activeWorkspace.id, botId);

    const response = new NextResponse(null, { status: 204 });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
