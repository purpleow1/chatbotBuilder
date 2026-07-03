# HelpDock AI Chatbot Builder

Embeddable chatbot builder MVP. The app lets users create support bots, upload company knowledge, test answers in an in-app chat, and publish an embeddable widget.

The current repo state implements **Steps 1-7** from [IMPLEMENTATION_PLAN.md](/Users/user/repos/chatbotBuilder/IMPLEMENTATION_PLAN.md): a Next.js app shell with product routes, shared UI primitives, Tailwind styling, TanStack Query provider, Supabase schema planning, server-only Supabase data access, Supabase email/password auth with first-login workspace onboarding, API-backed bot management, source document upload management, Gemini-powered ingestion with vector retrieval, and a grounded RAG chat API.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS with shadcn/ui-compatible primitives
- TanStack Query
- Supabase Postgres with pgvector schema migration
- Server-only Supabase service-role client for API routes and DB modules
- Google Gemini embeddings for document retrieval and grounded chat responses
- mammoth and pdf-parse for DOCX/PDF text extraction
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

Step 2 adds the initial SQL migration at [supabase/migrations/202607020001_initial_schema.sql](/Users/user/repos/chatbotBuilder/supabase/migrations/202607020001_initial_schema.sql). Step 3 adds service-role grants at [supabase/migrations/202607020002_grant_service_role_access.sql](/Users/user/repos/chatbotBuilder/supabase/migrations/202607020002_grant_service_role_access.sql). Step 5 adds the private Storage bucket at [supabase/migrations/202607020003_create_source_documents_bucket.sql](/Users/user/repos/chatbotBuilder/supabase/migrations/202607020003_create_source_documents_bucket.sql). Apply all migrations to a Supabase project with the SQL editor or Supabase CLI before wiring authenticated app flows.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# or legacy fallback:
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_CHAT_MODEL=gemini-2.0-flash
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is used for Supabase Auth cookies. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported as a legacy fallback and can later be reused for Realtime. CRUD data access should go through REST API routes backed by the service-role client, not through a browser Supabase data client.

The schema intentionally does not add RLS policies. API routes validate the user session, check workspace membership, and then call server-only DB modules.

API routes include:

- `GET /api/health`: reports missing Supabase env vars with a developer-facing response.
- `GET /api/workspaces`: example authenticated REST boundary that lists the caller's active workspaces from API/DB modules.
- `GET /api/bots`: lists bots for the active workspace and returns plan capacity.
- `POST /api/bots`: creates a bot after Zod validation and plan-limit checks.
- `GET /api/bots/[botId]`, `PATCH /api/bots/[botId]`, `DELETE /api/bots/[botId]`: reads, updates, and deletes workspace-scoped bots.
- `GET /api/bots/[botId]/documents`: lists workspace-scoped source documents for a bot.
- `POST /api/bots/[botId]/documents`: uploads `.txt`, `.md`, `.pdf`, `.docx`, and `.csv` files up to 10 MB into the private `source-documents` bucket, extracts text, chunks it, generates embeddings, and stores searchable chunks.
- `POST /api/bots/[botId]/documents/[documentId]/ingest`: retries ingestion for a queued or failed document.
- `DELETE /api/bots/[botId]/documents/[documentId]`: deletes document chunks, metadata, and the stored file.
- `GET /api/bots/[botId]/retrieval-test?query=...`: authenticated internal retrieval check that returns the top matching chunks for the active workspace.
- `GET /api/chat?botId=...&conversationId=...`: authenticated conversation reload endpoint that returns persisted messages for a bot-scoped conversation.
- `POST /api/chat`: authenticated RAG chat endpoint. It accepts `botId`, optional `conversationId`, and `message.parts`, retrieves bot-scoped chunks, generates a grounded Gemini answer, persists the user and assistant messages, returns citations, and records usage events.

The RAG schema uses `document_chunks.embedding vector(768)`, matching the MVP choice to request 768-dimensional Google Gemini embeddings from `gemini-embedding-2`.

## Auth And Workspace Onboarding

Supabase Auth email/password is wired through `@supabase/ssr` cookie sessions. The `/app` route group is protected by middleware, `/login` and `/signup` submit through server actions, and `GET /api/account` creates the mirrored `users`, default `workspaces`, owner `workspace_members`, and free `subscriptions` rows the first time an authenticated user enters the app.

Supabase dashboard settings to verify:

- Authentication > Providers: enable Email.
- Authentication > URL Configuration: set Site URL to `http://localhost:3000` locally and add your deployed URL later.
- Redirect URLs: add `http://localhost:3000/auth/confirm` and `http://localhost:3000/app`.
- For immediate local MVP testing, disable email confirmations. If confirmations stay enabled, update the Confirm signup email template to send users to `/auth/confirm` with a token hash, or use Supabase's PKCE/code confirmation redirect.

Manual auth checks:

- Open `/api/health` and confirm service-role database access is working.
- Visit `/signup`, create an account, and confirm that `/app` shows your workspace name in the header.
- Visit `/api/workspaces` while logged in and confirm it returns only your workspace.
- Use the logout button, then confirm `/app` redirects back to `/login`.
- Refresh `/app` after logging in and confirm the session persists.

## Bot Management

Step 4 wires `/app/bots`, `/app/bots/new`, and `/app/bots/[botId]` to the bot API. Bot forms support name, description/purpose, support tone, public widget availability, and fallback copy. The free-plan bot limit is enforced in the UI and in `POST /api/bots`.

Manual bot checks:

- Create a bot from `/app/bots/new` and confirm it appears immediately at `/app/bots`.
- Edit its settings at `/app/bots/[botId]`, refresh, and confirm the values persisted.
- On the free plan, confirm creating a second bot is blocked and points to Billing.
- Delete the bot from its settings page and confirm the list returns to the empty state.

## Document Uploads And Ingestion

Step 5 uses a private Supabase Storage bucket named `source-documents`. Step 6 ingests uploaded files immediately in the server-only upload route. The route writes files under `workspaceId/botId/` paths, stores document metadata in `documents`, records `document_uploaded` usage events, downloads the private object with the service-role client, extracts readable text, chunks it, generates embeddings, stores rows in `document_chunks`, and marks the document `ready`.

Supported source files:

- `.txt`
- `.md`
- `.pdf`
- `.docx`
- `.csv`

The app and bucket both enforce a 10 MB file limit. Manual checks:

- Add `GEMINI_API_KEY` to `.env.local` before testing ingestion.
- Upload a supported file from `/app/bots/[botId]` and confirm it appears in the knowledge list with `ready` status after refresh.
- Try an unsupported extension and confirm the route returns a useful validation error.
- If ingestion fails, confirm the document shows `failed` status and use Retry after fixing the cause.
- Call `/api/bots/[botId]/retrieval-test?query=your%20phrase` while logged in and confirm it returns chunks from that bot only.
- Delete the document and confirm it disappears from the knowledge list.

## Chat API

Step 7 adds `/api/chat` for authenticated in-app chat turns. The route only works for bots in the caller's active workspace, stores structured message parts as the canonical payload in `messages.parts`, writes source citations to the assistant message, and increments `message_sent` plus `assistant_response` usage events.

Example request:

```json
{
  "botId": "00000000-0000-0000-0000-000000000000",
  "conversationId": "11111111-1111-1111-1111-111111111111",
  "message": {
    "parts": [
      {
        "type": "text",
        "text": "What does the refund policy say?"
      }
    ]
  }
}
```

Omit `conversationId` to start a new conversation. File parts can be persisted for future UI work, but Step 7 uses text parts for retrieval and answer generation.

Gemini chat configuration:

- Default model: `gemini-2.0-flash`
- Override env var: `GEMINI_CHAT_MODEL`
- Generation settings: temperature `0.2`, top-p `0.8`, max output tokens `900`
- Safety settings: medium-and-above blocking for harassment, hate speech, sexual content, and dangerous content

Manual chat checks:

- Add `GEMINI_API_KEY` to `.env.local` before testing.
- Upload and ingest a small source document until it shows `ready`.
- Send `POST /api/chat` with a question answerable from the document and confirm the response includes an answer and citations.
- Send a question unrelated to uploaded knowledge and confirm the response uses the bot fallback instead of inventing an answer.
- Reuse the returned `conversation.id` in another request and confirm messages are added to the same conversation.
- Call `GET /api/chat?botId=...&conversationId=...` and confirm it returns the persisted user and assistant messages.

## Implemented Routes

- `/login`
- `/signup`
- `/auth/confirm`
- `/app`
- `/app/bots`
- `/app/bots/new`
- `/app/bots/[botId]`
- `/app/bots/[botId]/chat`
- `/app/billing`
- `/widget/[botId]`

## Notes For Next Agents

- The Step 8 in-app chat UI should consume `/api/chat`; the current `/app/bots/[botId]/chat` page is still a static placeholder.
- Billing checkout and the real widget loader are intentionally not implemented yet.
- Keep client components and Server Components away from Supabase/DB modules. Fetch app data through API routes.
- The dashboard uses live bot capacity, while document and message statistics remain demo data until later steps.
