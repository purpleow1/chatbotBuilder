# HelpDock AI Chatbot Builder

Embeddable chatbot builder MVP. The app lets users create support bots, upload company knowledge, test answers in an in-app chat, and publish an embeddable widget.

The current repo state implements **Steps 1-2** from [IMPLEMENTATION_PLAN.md](/Users/user/repos/chatbotBuilder/IMPLEMENTATION_PLAN.md): a Next.js app shell with product routes, shared UI primitives, Tailwind styling, TanStack Query provider, Supabase schema planning, server-only Supabase access helpers, and starter API-route data boundaries.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS with shadcn/ui-compatible primitives
- TanStack Query
- Supabase Postgres with pgvector schema migration
- Server-only Supabase service-role client for API routes and DB modules
- lucide-react icons

## Getting Started

Install dependencies:

```bash
npm install
```

Copy environment defaults:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/app](http://localhost:3000/app).

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Supabase Setup

Step 2 adds the initial SQL migration at [supabase/migrations/202607020001_initial_schema.sql](/Users/user/repos/chatbotBuilder/supabase/migrations/202607020001_initial_schema.sql). Apply it to a Supabase project with the SQL editor or Supabase CLI before wiring authenticated app flows.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept in [.env.example](/Users/user/repos/chatbotBuilder/.env.example) for future Supabase Realtime usage only. CRUD data access should go through REST API routes backed by the service-role client, not through a browser Supabase data client.

The schema intentionally does not add RLS policies. API routes validate the user session, check workspace membership, and then call server-only DB modules.

Step 2 also adds:

- `GET /api/health`: reports missing Supabase env vars with a developer-facing response.
- `GET /api/workspaces`: example authenticated REST boundary that lists the caller's active workspaces from API/DB modules.

The RAG schema uses `document_chunks.embedding vector(768)`, matching the MVP choice to request 768-dimensional Google Gemini embeddings.

## Implemented Routes

- `/login`
- `/signup`
- `/app`
- `/app/bots`
- `/app/bots/new`
- `/app/bots/[botId]`
- `/app/bots/[botId]/chat`
- `/app/billing`
- `/widget/[botId]`

## Notes For Next Agents

- Auth UI wiring, product persistence, document upload, RAG, billing, and the real widget loader are intentionally not implemented yet.
- Keep client components and Server Components away from Supabase/DB modules. Fetch app data through API routes.
- Forms are visual shells for Step 1 and should be wired in later steps.
- The dashboard includes demo data so the app has a realistic product feel before the backend exists.
