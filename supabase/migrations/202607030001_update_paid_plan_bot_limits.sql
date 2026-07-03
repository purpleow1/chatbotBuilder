update public.subscriptions
set bot_limit = 10,
    updated_at = now()
where plan = 'pro'
  and bot_limit <> 10;

update public.subscriptions
set bot_limit = 30,
    updated_at = now()
where plan = 'business'
  and bot_limit <> 30;
