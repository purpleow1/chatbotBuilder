import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { createChatTurn, getChatConversation } from "@/lib/db/chat";
import { ensureAccountForUser } from "@/lib/db/onboarding";

export const runtime = "nodejs";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1, "Text message parts cannot be empty.").max(4000, "Message text is too long.")
});

const filePartSchema = z.object({
  type: z.literal("file"),
  url: z.string().url("File message parts need a valid URL."),
  filename: z.string().trim().min(1, "File message parts need a filename.").max(180),
  mediaType: z.string().trim().min(1, "File message parts need a media type.").max(120)
});

const chatRequestSchema = z.object({
  botId: z.string().uuid("Choose a valid bot."),
  conversationId: z.string().uuid("Choose a valid conversation.").optional(),
  message: z.object({
    parts: z
      .array(z.discriminatedUnion("type", [textPartSchema, filePartSchema]))
      .min(1, "Send at least one message part.")
      .max(8, "Send fewer message parts.")
  })
});

const chatQuerySchema = z.object({
  botId: z.string().uuid("Choose a valid bot."),
  conversationId: z.string().uuid("Choose a valid conversation.")
});

function validationError(error: ZodError) {
  return new ApiError(400, error.issues[0]?.message ?? "Chat request is invalid.", "invalid_chat_request");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const parsed = chatQuerySchema.safeParse({
      botId: searchParams.get("botId"),
      conversationId: searchParams.get("conversationId")
    });

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const result = await getChatConversation(
      account.activeWorkspace.id,
      parsed.data.botId,
      parsed.data.conversationId
    );
    const response = NextResponse.json(result);

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const result = await createChatTurn(account.activeWorkspace.id, {
      botId: parsed.data.botId,
      conversationId: parsed.data.conversationId,
      userId: user.id,
      parts: parsed.data.message.parts
    });
    const response = NextResponse.json(
      {
        conversation: result.conversation,
        messages: {
          user: result.userMessage,
          assistant: result.assistantMessage
        },
        answer: {
          text: result.assistantMessage.content_text,
          parts: result.assistantMessage.parts,
          citations: result.citations
        }
      },
      { status: 201 }
    );

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
