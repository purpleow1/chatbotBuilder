import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { getSafeNextPath } from "@/lib/auth/redirects";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = getParam(resolvedSearchParams, "error");
  const message = getParam(resolvedSearchParams, "message");
  const nextPath = getSafeNextPath(getParam(resolvedSearchParams, "next"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Access your bots, knowledge sources, and widget settings.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {message}
          </div>
        ) : null}
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <SubmitButton pendingLabel="Logging in..." className="w-full">
            Continue
          </SubmitButton>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to AskDoc?{" "}
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
