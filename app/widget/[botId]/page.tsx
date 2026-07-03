import { MessageCircleOff } from "lucide-react";
import { WidgetChatClient } from "@/app/widget/[botId]/widget-chat-client";
import { ApiError } from "@/lib/api/errors";
import { getPublicWidgetConfig } from "@/lib/db/widget";

export default async function WidgetPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  try {
    const widget = await getPublicWidgetConfig(botId);

    return (
      <main className="h-dvh min-h-[420px] bg-transparent">
        <WidgetChatClient widget={widget} />
      </main>
    );
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "This chatbot is temporarily unavailable.";

    return (
      <main className="grid h-dvh min-h-[420px] place-items-center bg-white p-6 text-center text-slate-800">
        <div className="max-w-xs space-y-3">
          <span className="mx-auto grid size-11 place-items-center rounded-md bg-slate-100 text-slate-500">
            <MessageCircleOff className="size-5" />
          </span>
          <h1 className="text-base font-semibold">Chat unavailable</h1>
          <p className="text-sm leading-6 text-slate-500">{message}</p>
        </div>
      </main>
    );
  }
}
