grant usage on schema public to service_role;

grant usage on type public.workspace_role to service_role;
grant usage on type public.membership_status to service_role;
grant usage on type public.bot_status to service_role;
grant usage on type public.document_status to service_role;
grant usage on type public.conversation_channel to service_role;
grant usage on type public.conversation_status to service_role;
grant usage on type public.message_role to service_role;
grant usage on type public.subscription_plan to service_role;
grant usage on type public.subscription_status to service_role;
grant usage on type public.usage_event_type to service_role;

grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.workspaces to service_role;
grant select, insert, update, delete on table public.workspace_members to service_role;
grant select, insert, update, delete on table public.bots to service_role;
grant select, insert, update, delete on table public.documents to service_role;
grant select, insert, update, delete on table public.document_chunks to service_role;
grant select, insert, update, delete on table public.conversations to service_role;
grant select, insert, update, delete on table public.messages to service_role;
grant select, insert, update, delete on table public.subscriptions to service_role;
grant select, insert, update, delete on table public.usage_events to service_role;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.match_document_chunks(uuid, uuid, vector, integer, double precision) to service_role;
