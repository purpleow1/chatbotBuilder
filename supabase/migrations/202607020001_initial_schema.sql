create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.membership_status as enum ('active', 'invited', 'disabled');
create type public.bot_status as enum ('draft', 'ready', 'disabled');
create type public.document_status as enum ('queued', 'processing', 'ready', 'failed');
create type public.conversation_channel as enum ('app', 'widget');
create type public.conversation_status as enum ('open', 'closed');
create type public.message_role as enum ('system', 'user', 'assistant', 'tool');
create type public.subscription_plan as enum ('free', 'pro', 'business');
create type public.subscription_status as enum ('mock_active', 'trialing', 'active', 'past_due', 'canceled');
create type public.usage_event_type as enum (
  'message_sent',
  'assistant_response',
  'document_uploaded',
  'document_ingested',
  'embedding_generated',
  'widget_loaded'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (length(trim(slug)) > 0),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.bots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  description text,
  purpose text,
  support_tone text,
  fallback_message text,
  public_widget_enabled boolean not null default false,
  status public.bot_status not null default 'draft',
  widget_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  file_name text not null check (length(trim(file_name)) > 0),
  storage_path text not null check (length(trim(storage_path)) > 0),
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  status public.document_status not null default 'queued',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (length(trim(content)) > 0),
  token_count integer check (token_count is null or token_count >= 0),
  page_number integer check (page_number is null or page_number > 0),
  embedding vector(768) not null,
  embedding_model text not null default 'gemini-embedding-2',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  started_by uuid references public.users(id) on delete set null,
  visitor_id text,
  channel public.conversation_channel not null default 'app',
  status public.conversation_status not null default 'open',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role public.message_role not null,
  parts jsonb not null default '[]'::jsonb check (jsonb_typeof(parts) = 'array'),
  content_text text not null default '',
  citations jsonb not null default '[]'::jsonb check (jsonb_typeof(citations) = 'array'),
  metadata jsonb not null default '{}'::jsonb,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'mock_active',
  billing_provider text not null default 'mock',
  stripe_customer_id text,
  stripe_subscription_id text,
  bot_limit integer not null default 1 check (bot_limit >= 0),
  document_limit integer not null default 5 check (document_limit >= 0),
  monthly_message_limit integer not null default 100 check (monthly_message_limit >= 0),
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid references public.bots(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  event_type public.usage_event_type not null,
  quantity integer not null default 1 check (quantity > 0),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger bots_set_updated_at
before update on public.bots
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index bots_workspace_id_idx on public.bots(workspace_id);
create index bots_created_by_idx on public.bots(created_by);
create index documents_workspace_id_idx on public.documents(workspace_id);
create index documents_bot_id_idx on public.documents(bot_id);
create index documents_uploaded_by_idx on public.documents(uploaded_by);
create index document_chunks_workspace_id_idx on public.document_chunks(workspace_id);
create index document_chunks_bot_id_idx on public.document_chunks(bot_id);
create index document_chunks_document_id_idx on public.document_chunks(document_id);
create index conversations_workspace_id_idx on public.conversations(workspace_id);
create index conversations_bot_id_idx on public.conversations(bot_id);
create index conversations_started_by_idx on public.conversations(started_by);
create index messages_workspace_id_idx on public.messages(workspace_id);
create index messages_bot_id_idx on public.messages(bot_id);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index usage_events_workspace_id_occurred_at_idx on public.usage_events(workspace_id, occurred_at desc);
create index usage_events_bot_id_idx on public.usage_events(bot_id);
create index usage_events_conversation_id_idx on public.usage_events(conversation_id);
create index usage_events_message_id_idx on public.usage_events(message_id);
create index document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_document_chunks(
  target_workspace_id uuid,
  target_bot_id uuid,
  query_embedding vector(768),
  match_count integer default 5,
  similarity_threshold double precision default 0
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  page_number integer,
  metadata jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.page_number,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.workspace_id = target_workspace_id
    and dc.bot_id = target_bot_id
    and d.status = 'ready'
    and 1 - (dc.embedding <=> query_embedding) >= similarity_threshold
  order by dc.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

comment on table public.users is 'Application users mirrored from Supabase auth.users. Use public.users in SQL when disambiguating from auth.users.';
comment on table public.workspace_members is 'Workspace membership and role assignments. Authorization is enforced in API routes, not RLS.';
comment on table public.messages is 'Chat messages with structured multimodal parts as the canonical payload.';
comment on column public.document_chunks.embedding is 'Gemini embedding vector. The MVP fixes output_dimensionality at 768 for pgvector storage.';
comment on function public.match_document_chunks(uuid, uuid, vector, integer, double precision) is 'Workspace- and bot-scoped vector search. API routes must validate workspace access before calling.';
