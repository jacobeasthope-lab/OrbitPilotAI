create table if not exists public.marketing_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  subscribed boolean not null default true,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.marketing_subscriptions enable row level security;
grant usage on schema public to authenticated;
grant select, insert, update on public.marketing_subscriptions to authenticated;

drop policy if exists "Users read their own marketing preference" on public.marketing_subscriptions;
create policy "Users read their own marketing preference"
  on public.marketing_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users create their own marketing preference" on public.marketing_subscriptions;
create policy "Users create their own marketing preference"
  on public.marketing_subscriptions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and lower(email) = lower(auth.jwt() ->> 'email')
    and subscribed = true
  );

drop policy if exists "Users update their own marketing preference" on public.marketing_subscriptions;
create policy "Users update their own marketing preference"
  on public.marketing_subscriptions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

create or replace function public.update_marketing_subscription_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if new.subscribed then
      new.consented_at := now();
    else
      new.unsubscribed_at := now();
    end if;
  else
    if new.subscribed and not old.subscribed then
      new.consented_at := now();
      new.unsubscribed_at := null;
    elsif not new.subscribed and old.subscribed then
      new.unsubscribed_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists marketing_subscription_timestamps on public.marketing_subscriptions;
create trigger marketing_subscription_timestamps
  before insert or update on public.marketing_subscriptions
  for each row
  execute function public.update_marketing_subscription_timestamps();
