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

- Keep client code, REST API routes, and DB access modules separate.
- Fetch application data from API routes only. Do not call Supabase or DB helpers from components, including Server Components.
- Access Supabase from server-side API/DB modules with the service account key only.
- Do not use a public Supabase data client or RLS for CRUD access. Supabase Realtime may use a public client when needed because browser Realtime requires it.

## Product Scope

Build a real MVP for a SaaS product called something like **HelpDock AI**: users create a workspace, upload company knowledge, train a chatbot, test it in-app, and embed it on their own site.

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

Each step below should be executable by a separate agent. Before starting a step, the agent should:

- Read this file and the current repo state.
- Confirm the previous dependent steps are present.
- Keep changes scoped to the step.
- Add or update tests for the behavior it touches when practical.
- Update README/env docs if the step introduces setup or usage changes.
- Run the relevant verification command before handing off.

Recommended completion note from each agent:

- Files changed
- Commands run
- Known limitations
- Manual checks completed

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
- Support at least `.txt`, `.md`, and `.pdf`.
- Store document metadata in `documents`.
- Show document list with status: queued, processing, ready, failed.
- Add delete document behavior that also removes chunks.
- Add file size/type validation.

What you can check:

- Uploading a supported file creates a document row and stores the file.
- Unsupported files show a useful error.
- Deleting a document removes it from the bot knowledge list.
- The page shows status clearly after refresh.

## Step 6: Ingestion Pipeline And Vector Search

Dependency: Step 5

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

## Step 7: Chat API With RAG

Dependency: Step 6

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

## Step 12: Tests And Quality Gates

Dependency: Steps 1-11

Goal: add enough automated coverage to trust the demo.

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
- `npm test` or equivalent passes.
- Playwright smoke test covers the core demo path.

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

## Suggested Parallelization

Some work can happen in parallel after the foundations are ready:

- After Step 1: design system polish and auth can start together, but merge carefully.
- After Step 4: document management, billing UI, and bot settings can be worked on by separate agents.
- After Step 7: in-app chat and embeddable widget can be separate agents.
- Step 11 can run alongside later feature work if agents coordinate on shared UI components.
- Step 12 should start early for utility logic but finish after features stabilize.

## Critical Demo Path

The MVP is ready when this path works end to end:

1. User signs up.
2. User creates a bot.
3. User uploads a document.
4. Document is processed into searchable chunks.
5. User asks a question in the in-app chat and receives a grounded answer.
6. User copies an embed snippet into a test page.
7. External widget answers from the same bot.
8. Free plan limits are visible and at least one upgrade flow works.
