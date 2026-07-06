# Agent Instructions

This repo is the AskDoc embeddable chatbot builder MVP. These
instructions consolidate the durable rules from `IMPLEMENTATION_PLAN.md`,
`.cursor/rules/project.mdc`, `DB_SCHEMA_PLAN.md`, and `README.md`.

## Start Here

- Before implementing a roadmap step or substantial feature, read
  `IMPLEMENTATION_PLAN.md`, `README.md`, and the current repo state.
- Check dependent roadmap steps before implementing a later step.
- Keep changes scoped to the requested step or feature.
- Preserve unrelated local changes. Do not revert files you did not change.
- Update `README.md` and `.env.example` when setup, commands, environment
  variables, or external-service requirements change.

## Dev Server Ownership

- Agents may start `npm run dev` only when it is needed for their own
  verification.
- Stop any dev server you started before handing off.
- Do not start, restart, leave running, or ask for approval to start the dev
  server at the end of a task.
- The project owner runs the handoff dev server manually.
- If browser or manual verification still needs a running server, say that
  briefly in the handoff instead of starting one.

## Architecture Rules

- Keep client components, REST API routes, and database access modules
  separate.
- Fetch application data through API routes only. React components, including
  Server Components, must not call Supabase clients or DB helpers directly.
- Server Components that need app data should use the repo's internal API fetch
  pattern.
- API routes validate input, authenticate the user, check workspace membership
  in application code, and then call DB modules.
- DB modules use a server-only Supabase service-role client for CRUD work.
- Never expose the service-role key or other secrets to browser bundles.
- Do not use a public Supabase data client or RLS policies for MVP CRUD access.
- Supabase Realtime is the only public-client exception, and only for browser
  Realtime channel usage. Do not use it for CRUD.
- Public widget access must also go through Next.js route handlers. Anonymous
  visitors should receive only the bot/conversation data those routes explicitly
  return.

## Tech And Product Conventions

- Use the existing Next.js App Router, React, TypeScript, Tailwind CSS,
  shadcn/ui-compatible primitives, lucide-react, TanStack Query, Supabase,
  Gemini, and Stripe patterns already present in the repo.
- The app is product-first. Do not add a marketing landing page unless the user
  explicitly asks for one.
- Prefer Stripe test checkout when Stripe keys exist. Keep the mock billing
  fallback working when keys are absent.
- Keep UI and API plan limits in sync.

## Data Model Guardrails

- Workspace membership is the tenant boundary. Workspace-scoped API access must
  be checked before returning or mutating data.
- Keep `workspace_id` and `bot_id` denormalized on hot tables where the schema
  already does so for simple scoped queries.
- `messages.parts` is the canonical message payload. `messages.content_text` is
  derived text for previews, search, debugging, and usage displays only.
- Store Supabase Storage object paths for uploaded files, not permanent public
  URLs. API routes can create signed URLs or provider-specific file references
  when needed.
- Document deletion should remove database chunks and the related Storage object
  in application code.
- Usage events are append-only billing/activity records where practical.
- `document_chunks.embedding` uses `vector(768)` for the current Gemini
  embedding setup. Changing dimensions requires a migration and re-embedding
  stored chunks.

## Environment Variables

- If you add, rename, or change any variable in `.env.example`, explicitly tell
  the user to add or update the same variable in `.env.local`.
- Include where to find each value, whether it is required now, and whether
  deployment environments also need it.
- Do not assume credentials, provider projects, webhooks, buckets, redirect
  URLs, or deployment settings are configured outside the repo unless the user
  says so or `README.md` documents them as already done.
- Use the current Supabase publishable key shape (`sb_publishable_...`) where
  relevant. Only introduce a `NEXT_PUBLIC_` Supabase key if browser-side
  Supabase usage is truly needed.

## Verification

- Run the relevant verification command before handing off.
- Prefer `npm run typecheck`, `npm run lint`, and `npm run build` for broad
  changes. Add or run narrower tests when touching focused logic.
- If tests are added or changed, document the command in `README.md` when useful.
- If verification cannot be completed because external services or credentials
  are missing, state that clearly and list what is needed.

## Integration Handoffs

When a change touches external services, credentials, storage, webhooks,
deployment, model providers, SQL migrations, or dashboard settings, include an
integration handoff with these labels where applicable:

- **Implemented in repo**: files, routes, migrations, docs, or UI changed in the
  repository.
- **User action required now**: external setup needed before the next requested
  work can continue.
- **Required before manual testing**: setup that can wait for coding but is
  needed before browser/API verification.
- **Required before deployment**: production setup needed before launch.

For SQL migrations, direct the user to apply migration files from
`supabase/migrations/` with the Supabase SQL editor or Supabase CLI. Do not ask
the user to manually recreate the same tables, functions, or buckets in a
dashboard unless the task requires a dashboard-only setting.

## Completion Notes

At handoff, summarize:

- Files changed
- Commands run
- Manual checks completed
- Known limitations
- Integration handoff, if external setup is involved
