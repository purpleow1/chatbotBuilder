import Link from "next/link";
import { Bot, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bots = [
  {
    id: "demo-support",
    name: "Acme Support",
    description: "Answers product setup, billing, and return policy questions.",
    status: "Ready",
    docs: 3,
    messages: 42
  }
];

export default function BotsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Bots</p>
          <h1 className="text-3xl font-semibold tracking-tight">Chatbot projects</h1>
          <p className="mt-2 text-muted-foreground">Manage the assistants your customers can test and embed.</p>
        </div>
        <Button asChild>
          <Link href="/app/bots/new">
            <Plus className="size-4" />
            New bot
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {bots.map((bot) => (
          <Card key={bot.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/app/bots/${bot.id}`} className="font-semibold hover:underline">
                      {bot.name}
                    </Link>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {bot.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{bot.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{bot.docs} knowledge docs</span>
                    <span>{bot.messages} messages this month</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/app/bots/${bot.id}/chat`}>
                    <MessageSquare className="size-4" />
                    Test
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Bot actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Free plan capacity</CardTitle>
          <CardDescription>Step 4 will enforce bot limits in the API and forms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full bg-primary" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">1 of 1 bots used. Upgrade from Billing to add more.</p>
        </CardContent>
      </Card>
    </div>
  );
}
