import { Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewBotPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">New bot</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create a support assistant</h1>
        <p className="mt-2 text-muted-foreground">
          Capture the bot identity now. Knowledge uploads and real persistence arrive in later steps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bot profile</CardTitle>
          <CardDescription>This will become the public personality for the in-app chat and widget.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Bot name</Label>
              <Input id="name" placeholder="Acme Support" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" placeholder="Answer setup, billing, and product questions" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Support tone</Label>
              <Input id="tone" placeholder="Clear, concise, friendly" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback">Fallback message</Label>
              <Input id="fallback" placeholder="I do not know yet, but our team can help." />
            </div>
            <div className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Public widget</p>
                <p className="text-sm text-muted-foreground">Allow this bot to be embedded after setup.</p>
              </div>
              <Button type="button" variant="outline">
                Enabled
              </Button>
            </div>
            <Button type="button">
              <Bot className="size-4" />
              Create bot
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {["Create profile", "Upload sources", "Test and embed"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-md border bg-card p-3 text-sm">
            <CheckCircle2 className="size-4 text-primary" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
