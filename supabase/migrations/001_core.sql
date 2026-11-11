-- AutoCRM foundation migration for Supabase/PostgreSQL.
-- DRAFT: reviewed RLS is mandatory before production. Nothing in this migration sends messages.
create extension if not exists pgcrypto;

create type public.service_status as enum ('received','diagnosis','progress','ready','delivered');
create type public.workshop_role as enum ('owner','manager','mechanic','receptionist');
create type public.notification_channel as enum ('email','whatsapp');
create type public.notification_job_status as enum ('queued','processing','sent','failed','canceled');
create type public.whatsapp_mode as enum ('personal','business_api');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  hours text not null default '',
  email text,
  phone_e164 text,
  whatsapp_mode public.whatsapp_mode not null default 'personal',
  whatsapp_phone_number_id text, -- server-managed, official WhatsApp Cloud API connection
  created_at timestamptz not null default now()
);
create table public.workshop_members (
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workshop_role not null,
  created_at timestamptz not null default now(),
  primary key (workshop_id,user_id)
);
create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone_e164 text,
  email text,
  service_message_allowed boolean not null default false,
  marketing_opt_in boolean not null default false,
  opt_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workshop_id,id)
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  customer_contact_id uuid not null,
  plate text,
  make_model text not null,
  model_year int,
  odometer_km int check (odometer_km is null or odometer_km >= 0),
  created_at timestamptz not null default now(),
  foreign key (workshop_id,customer_contact_id) references public.customer_contacts(workshop_id,id),
  unique (workshop_id,id)
);
create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  customer_contact_id uuid not null,
  vehicle_id uuid not null,
  status public.service_status not null default 'received',
  status_version int not null default 0,
  service_description text not null,
  quote_amount_cents int check (quote_amount_cents is null or quote_amount_cents >= 0),
  quote_approved_at timestamptz,
  next_review_at timestamptz,
  next_review_odometer_km int check (next_review_odometer_km is null or next_review_odometer_km>=0),
  ready_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workshop_id,customer_contact_id) references public.customer_contacts(workshop_id,id),
  foreign key (workshop_id,vehicle_id) references public.vehicles(workshop_id,id)
);
create index service_orders_workshop_status_idx on public.service_orders(workshop_id,status);
create index service_orders_review_idx on public.service_orders(next_review_at) where next_review_at is not null;
create index customer_contacts_user_idx on public.customer_contacts(user_id) where user_id is not null;
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id),
  occurred_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id,occurred_at desc);
create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  channel public.notification_channel not null,
  event_key text not null,
  status_version int not null,
  status public.notification_job_status not null default 'queued',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  unique(order_id,channel,event_key,status_version)
);
create index notification_jobs_due_idx on public.notification_jobs(status,scheduled_at);

-- SECURITY DEFINER helpers, callable by RLS but restricted to a boolean answer.
create function public.is_workshop_member(p_workshop_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workshop_members m
                where m.workshop_id = p_workshop_id and m.user_id = (select auth.uid()));
$$;
create function public.is_contact_user(p_workshop_id uuid,p_contact_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.customer_contacts c
      where c.workshop_id=p_workshop_id and c.id=p_contact_id and c.user_id=(select auth.uid()));
$$;
revoke all on function public.is_workshop_member(uuid) from public;
revoke all on function public.is_contact_user(uuid,uuid) from public;
grant execute on function public.is_workshop_member(uuid) to authenticated;
grant execute on function public.is_contact_user(uuid,uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_members enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_orders enable row level security;
alter table public.order_events enable row level security;
alter table public.notification_jobs enable row level security;

create policy profile_self_select on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profile_self_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy workshops_read on public.workshops for select to authenticated using (public.is_workshop_member(id));
create policy members_self_read on public.workshop_members for select to authenticated using (user_id=(select auth.uid()));
-- Workshop & first owner membership are created via a privileged server-side onboarding flow.
create policy contacts_read on public.customer_contacts for select to authenticated using (public.is_workshop_member(workshop_id) or user_id=(select auth.uid()));
create policy contacts_insert on public.customer_contacts for insert to authenticated with check (public.is_workshop_member(workshop_id));
create policy contacts_update on public.customer_contacts for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy vehicles_read on public.vehicles for select to authenticated using (public.is_workshop_member(workshop_id) or public.is_contact_user(workshop_id,customer_contact_id));
create policy vehicles_insert on public.vehicles for insert to authenticated with check (public.is_workshop_member(workshop_id));
create policy vehicles_update on public.vehicles for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy orders_read on public.service_orders for select to authenticated using (public.is_workshop_member(workshop_id) or public.is_contact_user(workshop_id,customer_contact_id));
create policy orders_insert on public.service_orders for insert to authenticated with check (public.is_workshop_member(workshop_id));
create policy orders_update on public.service_orders for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy events_read on public.order_events for select to authenticated using (public.is_workshop_member(workshop_id));
create policy notification_jobs_read on public.notification_jobs for select to authenticated using (public.is_workshop_member(workshop_id));
-- Clients approve/reject quotes via server-side functions with identity and state checks, not UPDATE access.
-- Queue workers use service_role credentials server-side only, never exposed to browser/mobile.

-- Idempotent queue creation on transition to ready. No external sending occurs inside the trigger.
create function public.enqueue_ready_notice() returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.customer_contacts%rowtype; w public.workshops%rowtype;
begin
  if new.status is distinct from old.status then
    new.status_version := old.status_version + 1;
    new.updated_at := now();
    if new.status='ready' then new.ready_at:=now(); end if;
    if new.status='delivered' then new.delivered_at:=now(); end if;
  end if;
  return new;
end; $$;
create trigger order_status_before_update before update on public.service_orders
for each row execute function public.enqueue_ready_notice();

create function public.after_order_ready() returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.customer_contacts%rowtype; w public.workshops%rowtype;
begin
  if new.status='ready' and old.status is distinct from 'ready' then
    select * into c from public.customer_contacts where id=new.customer_contact_id and workshop_id=new.workshop_id;
    select * into w from public.workshops where id=new.workshop_id;
    insert into public.order_events(order_id,workshop_id,event_type,actor_id)
      values(new.id,new.workshop_id,'vehicle_ready',auth.uid());
    if nullif(c.email,'') is not null and c.opt_out_at is null then
      insert into public.notification_jobs(order_id,workshop_id,channel,event_key,status_version)
        values(new.id,new.workshop_id,'email','vehicle_ready',new.status_version)
        on conflict do nothing;
    end if;
    if w.whatsapp_mode='business_api' and c.service_message_allowed=true and c.opt_out_at is null and nullif(c.phone_e164,'') is not null then
      insert into public.notification_jobs(order_id,workshop_id,channel,event_key,status_version)
        values(new.id,new.workshop_id,'whatsapp','vehicle_ready',new.status_version)
        on conflict do nothing;
    end if;
  end if;
  return new;
end; $$;
create trigger after_order_ready_trigger after update on public.service_orders
for each row execute function public.after_order_ready();
