# Embeddable Chatbot Builder MVP Implementation Plan

This plan assumes we can skip the marketing landing page and focus on the product app, billing/pricing surfaces, chatbot experience, embeddable widget, and demo deliverable.

## Recommended Stack

- App: Next.js App Router, React, TypeScript
- UI: Tailwind CSS, shadcn/ui, lucide-react
- Client data: TanStack Query
- Backend: Next.js Route Handlers as the REST API boundary
- Auth: Supabase Auth
- Database: Supabase Postgres with pgvector
- Storage: Supabase Storage for uploaded source files
- Realtime: Supabase Realtime for ingestion/job status and chat updates if useful
- AI: Google Gemini API for embeddings and chat completion, using free-tier-friendly models where possible
- Billing: Stripe test mode, with mock fallback if keys are absent
- Deployment: Vercel

## Architecture Requirements

- Follow the durable project architecture rules in [AGENTS.md](AGENTS.md).
- In short: keep components, API routes, and DB modules separate; fetch app data through API routes; and keep CRUD Supabase access server-only.

## Product Scope

Build a real MVP for a SaaS product called something like **AskDoc**: users create a workspace, upload company knowledge, train a chatbot, test it in-app, and embed it on their own site.

Core objects:

- Workspace
- Project / Bot
- Source document
- Document chunk with embedding
- Conversation
- Message
- Widget install settings
- Subscription / plan state

Suggested pricing:

- Free: 1 bot, 5 documents, 100 monthly messages, basic widget branding
- Pro: 3 bots, 100 documents, 2,000 monthly messages, remove branding, custom theme
- Business: unlimited bots within reasonable demo limits, team-ready settings, priority ingestion, advanced analytics mock

Billing can use Stripe test checkout when env vars exist and a mock upgrade path otherwise. The UI should still feel production-ready.

## Agent Working Contract

Each step below should be executable by a separate agent. Follow the durable agent workflow, environment-variable, verification, and handoff rules in [AGENTS.md](AGENTS.md).

Dev server ownership: agents may start `npm run dev` temporarily when needed for their own verification, but must stop it before handoff. Do not start, restart, leave running, or ask for approval to start the dev server at the end of the task; the project owner runs the handoff dev server manually. If final browser/manual verification still needs the user's manually running server, note that briefly in the handoff.

### How To Read Integration Handoffs

When an agent says a handoff action is needed, it means the code for that feature was added to the repo, but some external service may still need configuration before the feature works against a real account. The required handoff labels and migration guidance are defined in [AGENTS.md](AGENTS.md).

## Step 1: Bootstrap The App Shell

Dependency: none

Goal: create the base application with the chosen stack and a polished app layout.

Implementation tasks:

- Initialize a Next.js TypeScript app in this repo.
- Add Tailwind CSS, shadcn/ui, lucide-react, TanStack Query, Supabase client packages, Zod, React Hook Form if needed.
- Create base routes:
  - `/login`
  - `/signup`
  - `/app`
  - `/app/bots`
  - `/app/bots/new`
  - `/app/bots/[botId]`
  - `/app/billing`
  - `/widget/[botId]`
- Create a simple authenticated app frame with sidebar navigation.
- Add shared UI primitives and a consistent visual style.
- Add `.env.example`.
- Add README setup instructions.

What you can check:

- `npm run dev` starts successfully.
- Visiting `/app` shows a real dashboard shell, not a landing page.
- Sidebar links navigate without broken pages.
- The UI looks like a product app, not a template placeholder.

## Step 2: Supabase Project Integration And Schema

Dependency: Step 1

Goal: wire the app to Supabase and define the MVP data model.

Schema review draft: [DB_SCHEMA_PLAN.md](DB_SCHEMA_PLAN.md)

Implementation tasks:

- Add a server-only Supabase service-role client for API routes and DB modules.
- Add database migrations or SQL files for:
  - `users`
  - `workspaces`
  - `workspace_members`
  - `bots`
  - `documents`
  - `document_chunks`
  - `conversations`
  - `messages`
  - `subscriptions`
  - `usage_events`
- Enable pgvector and add an embedding vector column on `document_chunks`.
- Add REST API data-access patterns that keep components away from DB/Supabase calls.
- Add API-layer workspace membership checks for workspace-scoped access.
- Document Supabase setup and required env vars.

What you can check:

- Running the SQL/migrations in Supabase succeeds without manual fixes.
- A signed-in user can only see their own workspace data through API routes.
- Components fetch data from API routes only, including Server Components.
- No public Supabase data client or RLS policy is required for CRUD access.
- The app handles missing Supabase env vars with a clear developer-facing message.

Integration handoff to provide when complete:

- Create or select a Supabase project.
- Apply the SQL migration from `supabase/migrations/` in Supabase SQL editor or with Supabase CLI.
- Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
- Use the current Supabase publishable key (`sb_publishable_...`) instead of the legacy anon key. Reintroduce a `NEXT_PUBLIC_` Supabase key only if a later step needs browser-side Supabase Realtime.
- Verify `/api/health` reports Supabase as configured.

## Step 3: Authentication And Workspace Onboarding

Dependency: Step 2

Goal: users can sign up, sign in, and arrive inside their workspace.

Implementation tasks:

- Implement Supabase email/password auth.
- Protect `/app` routes.
- Create user/workspace records on first sign-in.
- Add logout.
- Add basic account/workspace switcher UI, even if MVP only creates one workspace.
- Add loading, empty, and error states.

What you can check:

- New user signup creates a workspace automatically.
- Logged-out users are redirected from `/app` to `/login`.
- Logging out prevents access to protected routes.
- Refreshing the page preserves the session.

Integration handoff to provide when complete:

- Supabase Auth provider settings to enable, including email/password and any redirect URLs.
- Auth-related env var changes, if any.
- Manual signup/login/logout verification steps.

## Step 4: Bot Management

Dependency: Step 3

Goal: users can create, view, edit, and delete chatbot projects.

Implementation tasks:

- Build bot list page with empty state.
- Build bot creation form with fields:
  - Name
  - Description / purpose
  - Support tone
  - Public widget enabled toggle
  - Optional fallback message
- Build bot detail settings page.
- Enforce plan limits at the UI and API layer.
- Add server-side validation with Zod.

What you can check:

- Creating a bot immediately appears in `/app/bots`.
- Editing bot settings persists after refresh.
- Free plan users cannot create more than the allowed number of bots.
- Empty states tell the user what to do next.

## Step 5: Document Upload And Knowledge Source Management

Dependency: Step 4

Goal: users can upload knowledge files and see ingestion status.

Implementation tasks:

- Add Supabase Storage bucket for source documents.
- Build upload UI on bot detail page.
- Support at least `.txt`, `.md`, `.pdf`, `.docx`, and `.csv`.
- Store document metadata in `documents`.
- Show document list with status: queued, processing, ready, failed.
- Add delete document behavior that also removes chunks.
- Add file size/type validation.

What you can check:

- Uploading a supported file creates a document row and stores the file.
- Unsupported files show a useful error.
- Deleting a document removes it from the bot knowledge list.
- The page shows status clearly after refresh.

Integration handoff to provide when complete:

- Implemented in repo:
  - Add a migration that creates or updates a private Supabase Storage bucket named `source-documents`.
  - Add server-only upload/delete routes that use the service-role client. No public bucket policy should be required for MVP CRUD uploads.
  - Configure app validation for `.txt`, `.md`, `.pdf`, `.docx`, and `.csv` files up to 10 MB.
- User action required before manual upload testing:
  - Apply the new Supabase migration from `supabase/migrations/`. This creates the `source-documents` bucket; do not create the bucket manually if you apply the migration.
  - If you are not testing uploads yet, this can wait. The next coding step can still be implemented, but upload and ingestion verification will fail until the bucket exists.
- Required before Step 6 verification:
  - Ensure the `source-documents` bucket exists in the Supabase project used by `.env.local`, because Step 6 reads uploaded source files and turns queued documents into chunks.
- Manual verification steps after configuration:
  - Upload a supported file and confirm it creates a `documents` row plus a stored object.
  - Upload an unsupported file and confirm the app shows a useful error.
  - Delete a document and confirm it disappears from the bot knowledge list and removes related chunks.

## Step 6: Ingestion Pipeline And Vector Search

Dependency: Step 5

Status: implemented in repo.

Goal: uploaded documents are converted into searchable knowledge chunks.

Implementation tasks:

- Extract text from supported file types.
- Chunk text with stable metadata: source document id, page if available, chunk index.
- Generate embeddings through the selected Google Gemini API embedding model.
- Store chunks and embeddings in Supabase.
- Add a vector search RPC/function scoped by bot id.
- Add retry/error handling for failed ingestion.
- Add a small internal test script or route for verifying retrieval.

What you can check:

- Uploading a small text/markdown file results in multiple chunks.
- Searching for a phrase from the document returns relevant chunks.
- Failed ingestion produces a visible failed status instead of silent failure.
- The same user cannot retrieve chunks from another user's bot.

Integration handoff to provide when complete:

- Implemented in repo:
  - Added extraction, chunking, Gemini embedding, chunk storage, retry, and scoped retrieval code.
  - Uploading a supported document now attempts ingestion immediately from `POST /api/bots/[botId]/documents`.
  - Added `POST /api/bots/[botId]/documents/[documentId]/ingest` for retrying queued or failed ingestion.
  - Added `GET /api/bots/[botId]/retrieval-test?query=...` for authenticated retrieval verification.
  - Uses the existing `public.match_document_chunks` RPC and `document_chunks.embedding vector(768)` schema from the initial migration.
  - Added `mammoth` for `.docx` extraction and `pdf-parse` for `.pdf` extraction.
- Required before manual ingestion/retrieval testing:
  - Create or use a Google AI Studio/Gemini API key and add `GEMINI_API_KEY` to `.env.local`.
  - Optional override: set `GEMINI_EMBEDDING_MODEL=gemini-embedding-2`; this is the repo default.
  - Ensure all Supabase migrations through Step 5 are applied, including the private `source-documents` bucket and the initial `match_document_chunks` RPC.
- Embedding model and dimensions:
  - Model: `gemini-embedding-2`.
  - Output dimensionality: `768`, matching `document_chunks.embedding vector(768)`.
  - Document embeddings are prefixed as `title: {fileName} | text: {chunk}` and query embeddings as `task: question answering | query: {query}`.
- Retry/job execution setup:
  - No external worker is required for the MVP. Ingestion runs synchronously during upload and through the retry API route.
  - Failed ingestion marks the document `failed` with an error message visible in the bot detail page.
  - Larger production deployments should move ingestion into a background queue before scaling past demo-sized documents.
- Manual retrieval test steps:
  - Upload a small `.txt` or `.md` file from `/app/bots/[botId]`.
  - Confirm the document status becomes `ready`.
  - Visit `/api/bots/[botId]/retrieval-test?query=some%20phrase%20from%20the%20document` while logged in.
  - Confirm returned matches contain chunks from that bot and source document.
- Verification completed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Known limitations:
  - Live ingestion could not be manually tested without configured Supabase Storage and `GEMINI_API_KEY`.
  - The dev server was not left running after implementation.

## Step 7: Chat API With RAG

Dependency: Step 6

Status: implemented in repo.

Goal: bots answer questions using uploaded knowledge.

Implementation tasks:

- Add `/api/chat` route.
- Accept bot id, conversation id, and structured user message parts.
- Retrieve top matching chunks by vector similarity.
- Build a grounded prompt using bot settings and retrieved context for the selected Google Gemini chat model.
- Stream or return assistant responses.
- Persist conversations and messages, storing message parts as the canonical payload.
- Include citations/source names in the response payload if practical.
- Track usage events for message counts.
- Add guardrails for missing knowledge and unsafe cross-bot access.

What you can check:

- Asking about uploaded content returns a relevant answer.
- Asking about unknown content produces a useful fallback, not a hallucinated answer.
- Refreshing a conversation page shows prior messages.
- Usage count increments after chat messages.

Integration handoff to provide when complete:

- Implemented in repo:
  - Added `POST /api/chat` for authenticated RAG chat turns.
  - Added `GET /api/chat?botId=...&conversationId=...` for authenticated conversation reloads.
  - Accepts `botId`, optional `conversationId`, and structured `message.parts`.
  - Validates workspace-scoped bot/conversation access before persisting messages.
  - Retrieves top bot-scoped chunks through the Step 6 vector search helper.
  - Builds a grounded prompt from bot settings and retrieved context.
  - Persists user and assistant messages with structured parts, text, metadata, and citations.
  - Records `message_sent` and `assistant_response` usage events.
  - Falls back to the bot fallback message when retrieved context is not relevant enough.
- Gemini chat model and configuration:
  - Default model: `gemini-3.1-flash-lite`.
  - Override env var: `GEMINI_CHAT_MODEL`.
  - Generation settings: temperature `0.2`, top-p `0.8`, max output tokens `900`.
  - Safety settings block medium-and-above harassment, hate speech, sexually explicit, and dangerous content.
- Required before manual chat testing:
  - Add `GEMINI_API_KEY` to `.env.local`.
  - Optional override: set `GEMINI_CHAT_MODEL` in `.env.local`.
  - Upload and ingest at least one ready source document for the target bot.
- Manual chat verification steps:
  - Send `POST /api/chat` with JSON like `{ "botId": "...", "message": { "parts": [{ "type": "text", "text": "What does the policy say?" }] } }`.
  - Confirm the response includes `answer.text`, `answer.parts`, and `answer.citations`.
  - Reuse the returned `conversation.id` as `conversationId` and confirm the route appends to the same conversation.
  - Call `GET /api/chat?botId=...&conversationId=...` and confirm the persisted messages are returned.
  - Ask about unknown content and confirm the assistant uses the fallback rather than inventing an answer.
- Verification completed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

## Step 8: In-App Chat Experience

Dependency: Step 7

Goal: users can test their chatbot inside the app.

Implementation tasks:

- Build ChatGPT-like bot testing interface at `/app/bots/[botId]/chat`.
- Add conversation list or a simple "new chat" flow.
- Display assistant responses, user messages, loading state, and errors.
- Show source citations when returned by the API.
- Add a compact bot readiness checklist: documents uploaded, ingestion ready, widget enabled.

What you can check:

- You can open a bot and chat with it without touching the widget.
- Loading and error states are clear.
- The chat feels responsive and messages do not jump around awkwardly.
- Sources are visible when the answer uses uploaded docs.

## Step 9: Embeddable Widget

Dependency: Step 7

Goal: customers can embed a chatbot on an external website.

Implementation tasks:

- Build public widget route at `/widget/[botId]`.
- Add widget JavaScript loader at `/api/widget-loader` or `/embed.js`.
- Provide an install snippet in the bot settings page.
- Support theme settings:
  - Primary color
  - Launcher position
  - Welcome message
  - Bot avatar/name
- Respect public/private widget setting.
- Prevent widget access to bots that are disabled or over plan limits.

What you can check:

- Copying the embed snippet into a plain local HTML file loads the chatbot.
- The widget can answer questions using the selected bot.
- Disabling the widget makes the embed unavailable.
- Theme settings visibly affect the widget.

Integration handoff to provide when complete:

- Public app URL / deployment URL needed by the embed snippet.
- CORS, allowed origins, or widget loader route settings.
- Manual external HTML test-page steps.

## Step 10: Billing, Plans, And Feature Gating

Dependency: Steps 4, 7, and 9

Goal: make pricing and limits feel real even if payments are mocked.

Implementation tasks:

- Build `/app/billing` with plan cards and current usage.
- Add Stripe test Checkout integration if keys are configured.
- Add mock upgrade/downgrade flow if Stripe env vars are missing.
- Store subscription state in `subscriptions`.
- Gate:
  - Bot count
  - Document count
  - Monthly messages
  - Remove widget branding
  - Custom widget theme
- Add clear upgrade prompts where limits are hit.

What you can check:

- Free plan limits block extra usage with a helpful upgrade prompt.
- Mock upgrade changes the active plan and unlocks gated features.
- If Stripe test keys are configured, checkout can be started.
- Billing page shows current plan and usage numbers.

Integration handoff to provide when complete:

- Stripe test-mode keys, webhook secret, product/price setup, and webhook endpoint URL.
- Mock billing fallback behavior when Stripe env vars are missing.
- Manual checkout and webhook verification steps.

## Step 11: Product Polish And MVP Hardening

Dependency: Steps 1-10

Goal: make the app feel launchable.

Implementation tasks:

- Add coherent empty states across app pages.
- Add skeleton/loading states for slow data.
- Add toast notifications for mutations.
- Add responsive layout checks for desktop and mobile.
- Improve copywriting in forms, upgrade prompts, errors, and onboarding.
- Add basic analytics page or bot activity panel if time allows.
- Add privacy/security notes in app settings if useful.

What you can check:

- There are no obvious placeholder labels or raw errors.
- Main workflows work on mobile width.
- Every destructive action asks for confirmation.
- A first-time user can understand the next action on each page.

## Step 12: Chat History And Conversation Continuity

Dependency: Steps 7-11

Goal: make both chat surfaces feel like real conversations instead of one-off question boxes.

Implementation tasks:

- Add per-bot conversation history in the main app chat.
- Show recent conversations with title, channel, and last message time.
- Allow selecting an existing conversation and loading persisted messages.
- Keep the current "New chat" flow.
- Persist widget `conversationId` in browser storage per bot/visitor.
- Reload the active widget conversation on open or refresh.
- Add a lightweight widget "start over" action.
- Include recent conversation turns in chat prompt construction so follow-up questions work.
- Keep retrieval grounded in uploaded knowledge and avoid using prior turns to invent unsupported facts.
- Ensure app conversations remain workspace-scoped and widget conversations remain visitor-scoped.

What you can check:

- Refreshing `/app/bots/[botId]/chat` can restore or reopen prior conversations.
- The widget keeps the same conversation after closing/reopening or page refresh.
- A follow-up like "What about the price?" can use prior context from the same conversation.
- Starting a new chat creates a separate conversation.
- Widget visitors cannot load another visitor's conversation.

## Step 13: Deployment Setup

Dependency: Steps 1-12

Goal: prepare the app for Vercel deployment.

Implementation tasks:

- Configure production env var documentation.
- Verify Supabase redirect URLs and auth callback URLs.
- Configure Vercel build command.
- Add deployment checklist to README.
- Ensure widget works from deployed domain with CORS/security headers.
- Add basic error boundaries and not-found pages.

What you can check:

- Vercel preview deploy builds successfully.
- Auth callback works on the deployed URL.
- Widget embed works from a separate test page.
- README explains exactly which env vars are required.

Integration handoff to provide when complete:

- Vercel project settings, production/preview env vars, and build command.
- Supabase auth redirect URLs for local, preview, and production domains.
- Any production CORS/widget domain settings.

## Step 14: Demo Tutorial Or Video Script

Dependency: Steps 1-13

Goal: create the required demo deliverable.

Implementation tasks:

- Write a concise demo script:
  - Create account
  - Create bot
  - Upload docs
  - Ask questions in-app
  - Customize widget
  - Embed widget
  - Show billing limits/upgrade
- Add screenshots or a written tutorial if video is not produced.
- Include test credentials or setup instructions for reviewers.
- Mention limitations honestly: test billing, AI API requirement, demo-scale ingestion.

What you can check:

- A reviewer can follow the tutorial from a fresh account.
- The demo highlights real functioning features, not just UI.
- Billing, widget, and RAG are all shown.
- The tutorial does not depend on private local-only state.

## Step 15: Optional Tests And Quality Gates

Dependency: Steps 1-14

Goal: add optional automated coverage if time remains before handoff.

Implementation tasks:

- Add unit tests for:
  - Plan limit logic
  - Chunking logic
  - Prompt/context construction
  - API validation
- Add integration tests for key API routes where practical.
- Add Playwright smoke tests for:
  - Signup/login or mocked session
  - Create bot
  - Upload document
  - Chat with bot
  - View billing page
  - Widget loads
- Add lint/typecheck/test commands to README.

What you can check:

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm test` or equivalent passes if tests are added.
- Playwright smoke test covers the core demo path if Playwright is added.

## Suggested Parallelization

Some work can happen in parallel after the foundations are ready:

- After Step 1: design system polish and auth can start together, but merge carefully.
- After Step 4: document management, billing UI, and bot settings can be worked on by separate agents.
- After Step 7: in-app chat and embeddable widget can be separate agents.
- Step 11 can run alongside later feature work if agents coordinate on shared UI components.
- Step 15 is optional and should only be added if there is time after the core demo path is stable.

## Critical Demo Path

The MVP is ready when this path works end to end:

1. User signs up.
2. User creates a bot.
3. User uploads a document.
4. Document is processed into searchable chunks.
5. User asks a question in the in-app chat and receives a grounded answer.
6. User can continue or reopen a prior in-app conversation.
7. User copies an embed snippet into a test page.
8. External widget answers from the same bot and keeps the same visitor conversation after refresh.
9. Free plan limits are visible and at least one upgrade flow works.
