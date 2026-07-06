import Link from "next/link";
import Image from "next/image";

const LOGO_SRC = "/logos/askdoc-logo.svg";
const PRODUCT_NAME = "AskDoc";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/app" className="mb-8 flex items-center justify-center gap-2">
          <Image src={LOGO_SRC} alt={`${PRODUCT_NAME} logo`} width={150} height={43} priority className="h-11 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}
