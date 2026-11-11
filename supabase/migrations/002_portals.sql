-- A primeira etapa oferece leitura. Cadastros e mutações exigirão fluxos próprios.
alter type public.service_status add value 'awaiting_approval' before 'progress';

alter table public.vehicles add unique (workshop_id, customer_contact_id, id);
alter table public.service_orders add foreign key (workshop_id, customer_contact_id, vehicle_id)
  references public.vehicles (workshop_id, customer_contact_id, id);
alter table public.service_orders add unique (workshop_id, id);
alter table public.order_events add foreign key (workshop_id, order_id)
  references public.service_orders (workshop_id, id);
alter table public.notification_jobs add foreign key (workshop_id, order_id)
  references public.service_orders (workshop_id, id);

drop policy profile_self_update on public.profiles;
drop policy contacts_insert on public.customer_contacts;
drop policy contacts_update on public.customer_contacts;
drop policy vehicles_insert on public.vehicles;
drop policy vehicles_update on public.vehicles;
drop policy orders_insert on public.service_orders;
drop policy orders_update on public.service_orders;

revoke all on public.profiles, public.workshops, public.workshop_members, public.customer_contacts,
  public.vehicles, public.service_orders, public.order_events, public.notification_jobs
  from public, anon, authenticated;

grant select (user_id, workshop_id) on public.workshop_members to authenticated;
grant select (user_id, id) on public.customer_contacts to authenticated;
grant select (id, workshop_id, customer_contact_id, created_at, service_description, status)
  on public.service_orders to authenticated;

revoke all on function public.is_workshop_member(uuid), public.is_contact_user(uuid, uuid)
  from public, anon;
revoke all on function public.enqueue_ready_notice(), public.after_order_ready()
  from public, anon, authenticated;
create or replace function public.after_order_ready() returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.customer_contacts%rowtype; w public.workshops%rowtype;
begin
  if new.status='ready' and old.status is distinct from 'ready' then
    select * into c from public.customer_contacts where id=new.customer_contact_id and workshop_id=new.workshop_id;
    select * into w from public.workshops where id=new.workshop_id;
    insert into public.order_events(order_id,workshop_id,event_type,actor_id)
      values(new.id,new.workshop_id,'vehicle_ready',auth.uid());
    if c.service_message_allowed and nullif(c.email,'') is not null and c.opt_out_at is null then
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
