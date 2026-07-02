import Link from "next/link";
import { Copy, FileText, MessageSquare, Palette, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function BotDetailPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const embedSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/embed.js" data-bot-id="${botId}"></script>`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Bot settings</p>
          <h1 className="text-3xl font-semibold tracking-tight">Acme Support</h1>
          <p className="mt-2 text-muted-foreground">Configure knowledge, testing, and widget installation.</p>
        </div>
        <Button asChild>
          <Link href={`/app/bots/${botId}/chat`}>
            <MessageSquare className="size-4" />
            Test chat
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Profile
            </CardTitle>
            <CardDescription>These settings will feed prompts and widget presentation later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bot name</Label>
              <Input id="name" defaultValue="Acme Support" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" defaultValue="Answer setup, billing, and return policy questions." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input id="tone" defaultValue="Friendly and specific" />
            </div>
            <Button type="button">Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Widget
            </CardTitle>
            <CardDescription>Copy this snippet after Step 9 connects the loader.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted p-3">
              <code className="break-all text-sm">{embedSnippet}</code>
            </div>
            <Button variant="outline" type="button">
              <Copy className="size-4" />
              Copy snippet
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Knowledge sources
          </CardTitle>
          <CardDescription>Document upload and processing arrive in Steps 5 and 6.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {["Getting started.md", "Returns policy.pdf", "Billing FAQ.txt"].map((doc, index) => (
              <div key={doc} className="rounded-md border bg-card p-4">
                <p className="font-medium">{doc}</p>
                <p className="mt-1 text-sm text-muted-foreground">{index === 2 ? "Processing" : "Ready"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
