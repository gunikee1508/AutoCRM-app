-- All browser/native mutations enter through explicitly granted RPCs.
create schema if not exists autocrm_private;
revoke all on schema autocrm_private from public, anon, authenticated;

alter table public.workshops
  add column trade_name text,
  add column cnpj text,
  add column postal_code text,
  add column street text,
  add column street_number text,
  add column complement text,
  add column district text,
  add column city text,
  add column state_code text,
  add column latitude numeric check (latitude between -90 and 90),
  add column longitude numeric check (longitude between -180 and 180),
  add column whatsapp_phone text,
  add column created_by uuid references auth.users on delete set null;
create unique index workshop_onboarding_retry on public.workshops
  (created_by, lower(name), lower(trade_name), postal_code);

create table public.workshop_images (
  workshop_id uuid references public.workshops on delete cascade,
  kind text check (kind in ('logo','photo')),
  jpeg bytea not null check(octet_length(jpeg) between 4 and 524288),
  primary key(workshop_id,kind)
);
create table public.portal_invites (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops on delete cascade,
  contact_id uuid,
  staff_role public.workshop_role check(staff_role <> 'owner'),
  recipient text not null,
  token_hash bytea not null unique,
  issued_by uuid not null references auth.users on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  closed_at timestamptz,
  check ((contact_id is null) <> (staff_role is null)),
  foreign key(workshop_id,contact_id) references public.customer_contacts(workshop_id,id) on delete cascade
);
create index invite_rate_idx on public.portal_invites(workshop_id,issued_at);
create unique index invite_active_contact on public.portal_invites(workshop_id,contact_id) where closed_at is null and contact_id is not null;
create unique index invite_active_staff on public.portal_invites(workshop_id,recipient) where closed_at is null and staff_role is not null;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null,
  contact_id uuid not null,
  starts_at timestamptz not null,
  description text not null,
  foreign key(workshop_id,contact_id) references public.customer_contacts(workshop_id,id) on delete cascade
);
create index appointments_contact_time on public.appointments(contact_id,starts_at);
alter table public.portal_invites enable row level security;
alter table public.workshop_images enable row level security;
alter table public.appointments enable row level security;
revoke all on public.portal_invites, public.workshop_images, public.appointments from public, anon, authenticated;

create function autocrm_private.identity_email() returns text language plpgsql stable set search_path = '' as $$
declare addr text;
begin
  select lower(trim(email)) into addr from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if coalesce(addr,'')='' then raise exception 'Confirme seu e-mail antes de continuar.'; end if;
  return addr;
end $$;

create function autocrm_private.field(doc jsonb, k text, required boolean default true)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := nullif(trim(doc->>k),'');
begin
  if (required and v is null) or length(v)>180 or (v is not null and jsonb_typeof(doc->k)<>'string')
    then raise exception 'Confira o campo %.', k; end if;
  return v;
end $$;

create function autocrm_private.email(v text) returns text language plpgsql immutable set search_path = '' as $$
begin
  if v is null or length(v)>254 or v !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'Informe um e-mail válido.'; end if;
  return lower(v);
end $$;

create function autocrm_private.phone(v text) returns text language plpgsql immutable set search_path = '' as $$
begin
  if v is null or v !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Use telefone com código do país, como +55.'; end if;
  return v;
end $$;

create function autocrm_private.has_role(shop uuid, roles public.workshop_role[], who uuid default auth.uid())
returns boolean language sql stable set search_path = '' as $$
  select exists(select 1 from public.workshop_members where workshop_id=shop and user_id=who and role=any(roles))
$$;

create function autocrm_private.ensure_profile() returns void language sql set search_path = '' as $$
  insert into public.profiles(id,full_name)
    select id,left(trim(coalesce(raw_user_meta_data->>'full_name','')),120) from auth.users where id=auth.uid()
    on conflict (id) do nothing
$$;
create function public.register_workshop(details jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  legal text := autocrm_private.field(details,'name');
  trade text := autocrm_private.field(details,'trade_name');
  postal text := autocrm_private.field(details,'postal_code');
  st text := upper(autocrm_private.field(details,'state_code'));
  street text := autocrm_private.field(details,'street');
  num text := autocrm_private.field(details,'street_number');
  extra text := autocrm_private.field(details,'complement',false);
  district text := autocrm_private.field(details,'district');
  city text := autocrm_private.field(details,'city');
  tax text := upper(autocrm_private.field(details,'cnpj',false));
  lat numeric := autocrm_private.field(details,'latitude',false)::numeric;
  lng numeric := autocrm_private.field(details,'longitude',false)::numeric;
  shop uuid;
begin
  perform autocrm_private.identity_email();
  if postal !~ '^[0-9]{8}$' or st !~ '^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$'
    or tax !~ '^[A-Z0-9]{12}[0-9]{2}$' or (lat is null) <> (lng is null)
    or lat not between -90 and 90 or lng not between -180 and 180 then raise exception 'Confira CEP, UF, CNPJ e coordenadas.'; end if;
  perform autocrm_private.ensure_profile();
  insert into public.workshops(name,trade_name,postal_code,state_code,street,street_number,complement,district,city,cnpj,
    latitude,longitude,created_by,address,phone_e164,whatsapp_phone,email,hours)
  values(legal,trade,postal,st,street,num,extra,district,city,tax,lat,lng,uid,
    concat_ws(', ',street,num,extra,district,city,st,postal),
    autocrm_private.phone(autocrm_private.field(details,'phone')),autocrm_private.phone(autocrm_private.field(details,'whatsapp')),
    autocrm_private.email(autocrm_private.field(details,'email')),autocrm_private.field(details,'hours'))
  on conflict (created_by,lower(name),lower(trade_name),postal_code) do nothing returning id into shop;
  if shop is null then
    select id into shop from public.workshops where created_by=uid and lower(name)=lower(legal) and lower(trade_name)=lower(trade) and postal_code=postal;
  else
    insert into public.workshop_members(workshop_id,user_id,role) values(shop,uid,'owner');
  end if;
  return shop;
end $$;

create function public.save_workshop_image(shop uuid, kind text, image_base64 text) returns void
language plpgsql security definer set search_path = '' as $$
declare bytes bytea;
begin
  perform autocrm_private.identity_email();
  if not autocrm_private.has_role(shop,'{owner,manager}') then raise exception 'Imagens exigem acesso de proprietário ou gerente.'; end if;
  if kind not in ('logo','photo') or length(image_base64)>699052 then raise exception 'Selecione um JPEG de até 512 KiB.'; end if;
  bytes := decode(image_base64,'base64');
  if bytes is null or octet_length(bytes) not between 4 and 524288 or substring(bytes for 3)<>decode('ffd8ff','hex')
    or substring(bytes from octet_length(bytes)-1)<>decode('ffd9','hex') then raise exception 'Selecione um JPEG válido de até 512 KiB.'; end if;
  insert into public.workshop_images values(shop,kind,bytes)
    on conflict on constraint workshop_images_pkey do update set jpeg=excluded.jpeg;
end $$;

create function public.create_customer(shop uuid, details jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid;
  contact_name text := autocrm_private.field(details,'name');
  contact_email text := autocrm_private.email(autocrm_private.field(details,'email'));
  contact_phone text := autocrm_private.phone(autocrm_private.field(details,'phone'));
begin
  perform autocrm_private.identity_email();
  if not autocrm_private.has_role(shop,'{owner,manager,receptionist}') then raise exception 'Sem permissão para cadastrar clientes.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(shop::text || contact_email, 1));
  select id into cid from public.customer_contacts where workshop_id=shop and name=contact_name
    and email=contact_email and phone_e164=contact_phone order by created_at,id limit 1;
  if cid is null then
    insert into public.customer_contacts(workshop_id,name,email,phone_e164)
      values(shop,contact_name,contact_email,contact_phone) returning id into cid;
  end if;
  return cid;
end $$;

create function public.issue_invite(shop uuid, contact uuid default null, staff_email text default null, staff_role public.workshop_role default null)
returns text language plpgsql security definer set search_path = '' as $$
declare recipient_email text; secret text := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
begin
  perform autocrm_private.identity_email();
  if contact is not null then
    if staff_role is not null or staff_email is not null or not autocrm_private.has_role(shop,'{owner,manager,receptionist}')
      then raise exception 'Sem permissão para este convite.'; end if;
    select lower(trim(email)) into recipient_email from public.customer_contacts where id=contact and workshop_id=shop and user_id is null;
  else
    if staff_role is null or staff_role='owner' or not autocrm_private.has_role(shop,'{owner}') then raise exception 'Somente o proprietário pode convidar funcionários.'; end if;
    recipient_email := autocrm_private.email(trim(staff_email));
  end if;
  if recipient_email is null then raise exception 'Contato indisponível para convite.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(shop::text,0));
  if (select count(*) from public.portal_invites where workshop_id=shop and issued_at>now()-interval '1 hour')>=60
    then raise exception 'Limite de convites da oficina atingido. Tente mais tarde.'; end if;
  update public.portal_invites i set closed_at=now() where workshop_id=shop and closed_at is null and
    (contact_id=contact or (contact is null and contact_id is null and recipient=recipient_email));
  insert into public.portal_invites(workshop_id,contact_id,staff_role,recipient,token_hash,issued_by)
    values(shop,contact,staff_role,recipient_email,sha256(convert_to(secret,'UTF8')),auth.uid());
  return secret;
end $$;

create function public.accept_invite(code text, area text) returns uuid language plpgsql security definer set search_path = '' as $$
declare addr text := autocrm_private.identity_email(); i public.portal_invites%rowtype;
begin
  if code ~ '^[0-9a-f]{64}$' then
    select * into i from public.portal_invites where token_hash=sha256(convert_to(code,'UTF8')) for update;
  end if;
  if i.id is null or i.closed_at is not null or i.expires_at<=clock_timestamp() or i.recipient<>addr
    or area is distinct from (case when i.contact_id is null then 'oficina' else 'motorista' end)
    then raise exception 'Convite indisponível para esta conta ou área.'; end if;
  perform autocrm_private.ensure_profile();
  if i.contact_id is null then
    if not autocrm_private.has_role(i.workshop_id,'{owner}',i.issued_by) then raise exception 'Convite indisponível.'; end if;
    insert into public.workshop_members(workshop_id,user_id,role) values(i.workshop_id,auth.uid(),i.staff_role) on conflict do nothing;
    if not found then raise exception 'Esta conta já integra a equipe.'; end if;
  else
    if not autocrm_private.has_role(i.workshop_id,'{owner,manager,receptionist}',i.issued_by) then raise exception 'Convite indisponível.'; end if;
    update public.customer_contacts set user_id=auth.uid() where id=i.contact_id and workshop_id=i.workshop_id and user_id is null and lower(trim(email))=addr;
    if not found then raise exception 'Convite indisponível.'; end if;
  end if;
  update public.portal_invites set closed_at=now() where id=i.id;
  return i.workshop_id;
end $$;

create function public.set_staff_role(shop uuid, member_id uuid, new_role public.workshop_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform autocrm_private.identity_email();
  if not autocrm_private.has_role(shop,'{owner}') or new_role='owner' then raise exception 'Alteração não permitida.'; end if;
  if new_role is null then
    delete from public.workshop_members where workshop_id=shop and user_id=member_id and role<>'owner';
  else
    update public.workshop_members set role=new_role where workshop_id=shop and user_id=member_id and role<>'owner';
  end if;
  if not found then raise exception 'Funcionário indisponível.'; end if;
  update public.portal_invites set closed_at=now() where workshop_id=shop and issued_by=member_id and closed_at is null;
end $$;
create function public.revoke_portal_invite(shop uuid, invitation uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform autocrm_private.identity_email();
  update public.portal_invites i set closed_at=now() where id=invitation and workshop_id=shop and closed_at is null
    and (autocrm_private.has_role(shop,'{owner}') or (contact_id is not null and
      (autocrm_private.has_role(shop,'{manager}') or (issued_by=auth.uid() and autocrm_private.has_role(shop,'{receptionist}')))));
  if not found then raise exception 'Convite indisponível.'; end if;
end $$;
create function public.portal_snapshot(area text, selected uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare shops jsonb; shop uuid; actor_role public.workshop_role; result jsonb;
begin
  perform autocrm_private.identity_email();
  if area not in ('oficina','motorista') or area is null then raise exception 'Área inválida.'; end if;
  select coalesce(jsonb_agg(to_jsonb(s) order by s.name,s.id),'[]') into shops from (
    select w.id, coalesce(w.trade_name,w.name) as name,w.address,w.hours,w.phone_e164 as phone,w.whatsapp_phone,w.email,w.latitude,w.longitude,
      case when area='oficina' and m.role='owner' then w.name end as legal_name,
      case when area='oficina' and m.role='owner' then w.cnpj end as cnpj,
      (case when area='oficina' then m.role end) as role
    from public.workshops w left join public.workshop_members m on m.workshop_id=w.id and m.user_id=auth.uid()
    where (area='oficina' and m.user_id is not null) or (area='motorista' and exists (
      select 1 from public.customer_contacts c where c.workshop_id=w.id and c.user_id=auth.uid()))
  ) s;
  shop := coalesce(selected,(shops->0->>'id')::uuid);
  if shop is not null and not exists(select 1 from jsonb_array_elements(shops) s where s->>'id'=shop::text)
    then raise exception 'Oficina indisponível para esta conta.'; end if;
  select role into actor_role from public.workshop_members where workshop_id=shop and user_id=auth.uid() and area='oficina';
  result := jsonb_build_object('shops',shops,'selected',shop);
  return result || jsonb_build_object(
    'contacts',coalesce((select jsonb_agg(to_jsonb(c) order by c.name,c.id) from (
      select id,name,email,user_id is not null as linked from public.customer_contacts
      where workshop_id=shop and actor_role in ('owner','manager','receptionist')) c),'[]'),
    'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.user_id,'name',p.full_name,'email',u.email,'role',m.role) order by u.email)
      from public.workshop_members m join public.profiles p on p.id=m.user_id join auth.users u on u.id=m.user_id where m.workshop_id=shop and actor_role='owner'),'[]'),
    'invites',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email',i.recipient,'staff',i.staff_role is not null,'expires',i.expires_at) order by i.issued_at desc)
      from public.portal_invites i where i.workshop_id=shop and i.closed_at is null and i.expires_at>now() and
      (actor_role='owner' or (i.contact_id is not null and (actor_role='manager' or (actor_role='receptionist' and i.issued_by=auth.uid()))))),'[]'),
    'vehicles',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'name',v.make_model,'plate',v.plate) order by v.make_model)
      from public.vehicles v join public.customer_contacts c on c.id=v.customer_contact_id
      where v.workshop_id=shop and (area='oficina' or c.user_id=auth.uid())),'[]'),
    'orders',coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc) from (
      select so.id,so.service_description,so.status,so.created_at from public.service_orders so join public.customer_contacts c on c.id=so.customer_contact_id
      where so.workshop_id=shop and (area='oficina' or c.user_id=auth.uid()) order by so.created_at desc limit 50) o),'[]'),
    'appointments',coalesce((select jsonb_agg(to_jsonb(a) order by a.starts_at) from (
      select ap.id,ap.starts_at,ap.description from public.appointments ap join public.customer_contacts c on c.id=ap.contact_id
      where ap.workshop_id=shop and ap.starts_at>=now() and (area='oficina' or c.user_id=auth.uid()) order by ap.starts_at limit 50) a),'[]'),
    'images',coalesce((select jsonb_object_agg(kind,'data:image/jpeg;base64,'||replace(encode(jpeg,'base64'),chr(10),''))
      from public.workshop_images where workshop_id=shop),'{}')
  );
end $$;

-- Supabase installations can grant EXECUTE to anon explicitly through default privileges.
do $$
declare fn regprocedure;
begin
  for fn in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('register_workshop','save_workshop_image','create_customer',
      'issue_invite','accept_invite','set_staff_role','revoke_portal_invite','portal_snapshot')
  loop
    execute format('revoke all on function %s from public, anon, authenticated',fn);
    execute format('grant execute on function %s to authenticated',fn);
  end loop;
end $$;
revoke all on all functions in schema autocrm_private from public, anon, authenticated;
