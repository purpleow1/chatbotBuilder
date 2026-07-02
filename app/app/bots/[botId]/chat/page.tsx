import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const messages = [
  {
    role: "assistant",
    content: "Hi, I am Acme Support. Ask me about setup, returns, or billing."
  },
  {
    role: "user",
    content: "Can customers return a product after two weeks?"
  },
  {
    role: "assistant",
    content: "Yes. The demo policy says customers can return products within 30 days when items are unused."
  }
];

export default function BotChatPage() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-primary">Test chat</p>
        <h1 className="text-3xl font-semibold tracking-tight">Acme Support</h1>
        <p className="mt-2 text-muted-foreground">Validate answers before publishing the widget.</p>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex-1 space-y-4 overflow-y-auto rounded-md bg-muted/40 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-md px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card text-card-foreground"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                      <Sparkles className="size-3.5" />
                      Grounded answer
                    </div>
                  )}
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <form className="flex gap-2">
            <Input placeholder="Ask a question from your uploaded docs..." />
            <Button type="button" size="icon" aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
