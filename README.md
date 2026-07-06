# AskDoc

Embeddable chatbot builder MVP: upload company knowledge, turn it into a grounded AI support bot, test it in a ChatGPT-like in-app chat, and publish the same bot as an embeddable website widget.

The app is built as a real SaaS product MVP: authenticated workspaces, bot management, source document ingestion, vector search, chat history, widget install flow, usage limits, and billing/pricing surfaces.

> Live demo: https://chatbot-builder-delta-ruby.vercel.app/

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- Optional: Stripe test-mode keys for real checkout testing

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_URL` | Yes | Local default: `http://localhost:3000` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Used by Supabase Auth cookie helpers |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret server-only key for API and DB modules |
| `GEMINI_API_KEY` | Yes | Used for embeddings and chat responses |
| `GEMINI_EMBEDDING_MODEL` | No | Defaults to `gemini-embedding-2` |
| `GEMINI_CHAT_MODEL` | No | Defaults to `gemini-3.1-flash-lite` |
| `STRIPE_SECRET_KEY` | No | Enables Stripe checkout when configured |
| `STRIPE_PUBLISHABLE_KEY` | No | Used by billing UI when Stripe is configured |
| `STRIPE_WEBHOOK_SECRET` | No | Required for Stripe webhook verification |
| `STRIPE_PRO_PRICE_ID` | No | Stripe test price for Pro plan |
| `STRIPE_BUSINESS_PRICE_ID` | No | Stripe test price for Business plan |

### 3. Set up Supabase

1. Apply every migration in `supabase/migrations/` in filename order.
2. Confirm the `vector` extension is enabled.
3. Confirm the private Storage bucket `source-documents` exists. Migration `202607020003_create_source_documents_bucket.sql` creates it.
4. Authentication -> Providers: enable Email.
5. Authentication -> URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/app`

For quick local testing, disable email confirmations. If confirmations stay enabled, configure the signup email template to redirect through `/auth/confirm`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000/app](http://localhost:3000/app).

Useful local URLs:

| URL | Purpose |
| --- | --- |
| `/signup` | Create an account and workspace |
| `/login` | Sign in |
| `/app` | Product dashboard |
| `/app/bots` | Bot list |
| `/app/bots/new` | Create a bot |
| `/app/billing` | Plans, usage, and upgrade flow |
| `/api/health` | Supabase configuration check |

## Features

- **Workspace onboarding** - new users get a workspace, owner membership, and free subscription on first app entry.
- **Bot management** - create, edit, delete, and configure support bots with purpose, tone, fallback copy, and widget availability.
- **Document upload + RAG** - upload `.txt`, `.md`, `.pdf`, `.docx`, and `.csv` files; the app extracts text, chunks it, embeds it with Gemini, and stores vectors in Supabase Postgres.
- **In-app chatbot** - test each bot in a ChatGPT-like interface, continue previous conversations, and view source citations.
- **Embeddable widget** - enable a public widget, copy the install snippet, and let external site visitors chat with the same bot.
- **Conversation continuity** - app conversations are workspace-scoped; widget conversations are visitor-scoped.
- **Pricing and gates** - Free, Pro, and Business plans gate bot count, document count, monthly messages, widget branding, and theme features.
- **Billing flow** - Stripe checkout is used when test keys are configured; otherwise the app supports a mock upgrade flow for demos.
- **Usage tracking** - message, assistant response, document upload, ingestion, embedding, and widget events are stored in `usage_events`.
- **Product polish** - empty states, loading states, destructive-action confirmations, responsive app shell, and clear upgrade prompts.

## Pricing

| Plan | Limits | Positioning |
| --- | --- | --- |
| Free | 1 bot, 5 documents, 100 monthly messages | Try the product with a small support bot |
| Pro | 10 bots, 100 documents, 2,000 monthly messages | Remove widget branding and use custom widget theme settings |
| Business | 50 bots, 500 documents, 10,000 monthly messages | Higher-volume workspace with priority-style limits for demos |

Plan limits are enforced in API routes as well as the UI.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn/ui-compatible primitives, lucide-react |
| Data fetching | TanStack Query and API-backed server fetch helpers |
| Server | Next.js REST route handlers |
| Database | Supabase Postgres with pgvector |
| Storage | Supabase Storage private bucket for source documents |
| Auth | Supabase Auth with `@supabase/ssr` |
| AI | Google Gemini embeddings and chat completion |
| Billing | Stripe test mode with mock fallback |
| Deployment | Vercel + Supabase |

## Architecture

The project keeps client code, REST API, and database access separate:

```text
Client components / Server Components
  -> fetch API routes only
Next.js REST API routes
  -> validate input, authenticate, check workspace access
DB modules in lib/db/*
  -> use server-only Supabase service-role client
Supabase Postgres / Storage / Auth
```

Rules followed by the app:

- Components do not call Supabase tables directly.
- Server Components fetch app data from API routes through `fetchInternalApi()`.
- Supabase CRUD access is isolated in server-only modules.
- No public Supabase data client is used for application CRUD.
- RLS is not required for MVP CRUD access; API routes enforce authorization and workspace scoping.
- Secret keys are never exposed with `NEXT_PUBLIC_`.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Validate Supabase environment and service-role database access |
| `GET` | `/api/account` | Load or create the signed-in user's account, workspace, and subscription |
| `GET` | `/api/workspaces` | List workspaces available to the signed-in user |
| `GET` | `/api/bots` | List active-workspace bots and plan capacity |
| `POST` | `/api/bots` | Create a bot with Zod validation and plan-limit checks |
| `GET` | `/api/bots/[botId]` | Read one workspace-scoped bot |
| `PATCH` | `/api/bots/[botId]` | Update bot settings |
| `DELETE` | `/api/bots/[botId]` | Delete a bot |
| `GET` | `/api/bots/[botId]/documents` | List source documents for a bot |
| `POST` | `/api/bots/[botId]/documents` | Upload, extract, chunk, embed, and store a document |
| `DELETE` | `/api/bots/[botId]/documents/[documentId]` | Delete a document, chunks, and stored file |
| `POST` | `/api/bots/[botId]/documents/[documentId]/ingest` | Retry queued or failed ingestion |
| `GET` | `/api/bots/[botId]/retrieval-test?query=...` | Test scoped vector retrieval |
| `GET` | `/api/chat?botId=...` | List in-app conversations for a bot |
| `GET` | `/api/chat?botId=...&conversationId=...` | Load one conversation and its messages |
| `POST` | `/api/chat` | Create an authenticated RAG chat turn |
| `GET` | `/api/widget/[botId]` | Return public widget configuration |
| `GET` | `/api/widget/[botId]/chat` | Reload a visitor widget conversation |
| `POST` | `/api/widget/[botId]/chat` | Create a public widget chat turn |
| `GET` | `/embed.js` | Serve the embeddable widget loader |
| `GET` | `/api/billing` | Read plan and usage |
| `POST` | `/api/billing` | Start Stripe checkout or mock-upgrade |
| `POST` | `/api/stripe/webhook` | Handle Stripe subscription webhooks |

### Example chat request

```json
{
  "botId": "00000000-0000-0000-0000-000000000000",
  "conversationId": "11111111-1111-1111-1111-111111111111",
  "message": {
    "parts": [
      {
        "type": "text",
        "text": "What does our refund policy say?"
      }
    ]
  }
}
```

Omit `conversationId` to start a new conversation.

## Database design

Postgres lives in Supabase. Full SQL is in `supabase/migrations/`.

| Table | Purpose |
| --- | --- |
| `users` | App profile mirror of `auth.users` |
| `workspaces` | Workspace boundary for product data |
| `workspace_members` | User roles and workspace membership |
| `bots` | Chatbot settings and widget configuration |
| `documents` | Uploaded source file metadata and ingestion status |
| `document_chunks` | Searchable text chunks with `vector(768)` embeddings |
| `conversations` | In-app and widget conversation metadata |
| `messages` | Ordered messages with structured parts, text, metadata, and citations |
| `subscriptions` | Plan, billing provider, and feature limits |
| `usage_events` | Usage ledger for billing and limits |

Design notes:

- Workspace and bot IDs are denormalized onto hot tables for simple scoped queries.
- `messages.parts` is `jsonb`, matching the structured chat payload and allowing future multimodal parts.
- `document_chunks.embedding` uses pgvector HNSW cosine search.
- `match_document_chunks()` performs workspace- and bot-scoped retrieval over ready documents.
- Cascading foreign keys clean relational rows; API code cleans related Storage objects.

## Demo flow

1. Sign up and create a workspace.
2. Create a bot from `/app/bots/new`.
3. Upload a company FAQ, policy, or support document on the bot detail page.
4. Wait for the document to reach `ready`.
5. Open the bot chat page and ask a document-specific question.
6. Confirm the answer is grounded and includes citations.
7. Continue or reopen a previous conversation.
8. Enable the widget, copy the snippet, and open `/widget/[botId]`.
9. Ask the same bot a question from the widget.
10. Visit `/app/billing` and test plan limits or mock upgrade.

## Deployment

### Vercel

1. Push the repo to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add production and preview environment variables.
4. Deploy.
5. In Supabase Auth, add deployed redirect URLs:

```text
https://your-app.vercel.app/auth/confirm
https://your-app.vercel.app/app
```

### Stripe test mode

Stripe is optional for local demo use. When Stripe variables are missing, billing falls back to mock upgrades. To test real checkout:

1. Create Pro and Business test prices in Stripe.
2. Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_BUSINESS_PRICE_ID`.
3. Add `STRIPE_WEBHOOK_SECRET` for the deployed webhook endpoint.
4. Point Stripe webhooks to `/api/stripe/webhook`.

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Notes

- The app is focused on the product app; no marketing landing page is required for this submission.
- Chat responses are returned as completed assistant turns in the current API implementation.
- Ingestion runs synchronously during upload or retry, which is appropriate for the demo scope.
- For larger production usage, ingestion should move to a background queue.

