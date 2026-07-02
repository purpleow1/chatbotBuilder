import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function WidgetPreviewPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="flex h-[620px] w-full max-w-sm flex-col overflow-hidden rounded-lg border bg-white shadow-xl">
        <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-md bg-white/15">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h1 className="font-semibold">Acme Support</h1>
            <p className="text-xs text-primary-foreground/80">Widget preview for {botId}</p>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
          <div className="max-w-[84%] rounded-md border bg-white px-3 py-2 text-sm">
            Hi. Ask me anything about Acme docs.
          </div>
          <div className="ml-auto max-w-[84%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            Where do I install the app?
          </div>
          <div className="max-w-[84%] rounded-md border bg-white px-3 py-2 text-sm">
            The final answer engine arrives in Step 7. This shell is ready for the widget integration.
          </div>
        </div>
        <form className="flex gap-2 border-t bg-white p-3">
          <Input placeholder="Type your question..." />
          <Button type="button" size="icon" aria-label="Send widget message">
            <Send className="size-4" />
          </Button>
        </form>
      </section>
    </main>
  );
}
