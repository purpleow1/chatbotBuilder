# HelpDock AI Chatbot Builder

Embeddable chatbot builder MVP. The app lets users create support bots, upload company knowledge, test answers in an in-app chat, and publish an embeddable widget.

The current repo state implements **Step 1** from [IMPLEMENTATION_PLAN.md](/Users/user/repos/chatbotBuilder/IMPLEMENTATION_PLAN.md): a Next.js app shell with product routes, shared UI primitives, Tailwind styling, TanStack Query provider, and starter setup docs.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS with shadcn/ui-compatible primitives
- TanStack Query
- Supabase client packages prepared for later auth/database steps
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

- Auth, persistence, Supabase schema, document upload, RAG, billing, and the real widget loader are intentionally not implemented yet.
- Forms are visual shells for Step 1 and should be wired in later steps.
- The dashboard includes demo data so the app has a realistic product feel before the backend exists.
