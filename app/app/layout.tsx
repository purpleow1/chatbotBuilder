import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountContext } from "@/lib/db/onboarding";

type AccountApiResponse = {
  account?: AccountContext;
  error?: {
    code: string;
    message: string;
    missing?: string[];
  };
};

function getOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function getAccountContext() {
  const headerStore = await headers();
  const response = await fetch(`${getOrigin(headerStore)}/api/account`, {
    cache: "no-store",
    headers: {
      cookie: headerStore.get("cookie") ?? ""
    }
  });
  const payload = (await response.json().catch(() => ({}))) as AccountApiResponse;

  if (response.status === 401) {
    redirect("/login?next=/app");
  }

  if (!response.ok || !payload.account) {
    return {
      error: payload.error ?? {
        code: "account_setup_failed",
        message: "The workspace could not be loaded."
      }
    };
  }

  return {
    account: payload.account
  };
}

export default async function ProductLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await getAccountContext();

  if (result.error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Workspace setup needs attention</CardTitle>
            <CardDescription>{result.error.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error.missing?.length ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                Missing env: <span className="font-medium">{result.error.missing.join(", ")}</span>
              </div>
            ) : null}
            <Button asChild>
              <Link href="/api/health">Check API health</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <AppShell account={result.account}>{children}</AppShell>;
}
