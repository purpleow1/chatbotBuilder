import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingIncludes: {
    "/api/bots/[botId]/documents": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"],
    "/api/bots/[botId]/documents/[documentId]/ingest": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"]
  }
};

export default nextConfig;
