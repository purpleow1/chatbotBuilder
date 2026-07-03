import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { createWidgetChatTurn } from "@/lib/db/widget";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const widgetChatRequestSchema = z.object({
  conversationId: z.string().uuid("Choose a valid conversation.").optional(),
  visitorId: z.string().trim().min(8, "Visitor id is required.").max(120, "Visitor id is too long."),
  message: z.object({
    text: z.string().trim().min(1, "Message cannot be empty.").max(4000, "Message is too long.")
  })
});

function validationError(error: ZodError) {
  return new ApiError(400, error.issues[0]?.message ?? "Widget chat request is invalid.", "invalid_widget_chat_request");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    const parsed = widgetChatRequestSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const result = await createWidgetChatTurn({
      botId,
      conversationId: parsed.data.conversationId,
      visitorId: parsed.data.visitorId,
      text: parsed.data.message.text
    });

    return NextResponse.json(
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
      {
        status: 201,
        headers: corsHeaders
      }
    );
  } catch (error) {
    const response = apiErrorResponse(error);

    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));

    return response;
  }
}
