import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse"],
  outputFileTracingIncludes: {
    "/api/bots/[botId]/documents": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"],
    "/api/bots/[botId]/documents/[documentId]/ingest": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"]
  }
};

export default nextConfig;
