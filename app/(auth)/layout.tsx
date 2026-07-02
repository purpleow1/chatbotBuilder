import Link from "next/link";
import { BotMessageSquare } from "lucide-react";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/app" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BotMessageSquare className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">HelpDock AI</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
