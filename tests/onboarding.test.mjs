import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import {
  inviteCode,
  normalizeFields,
  validateFields,
  workshopSteps,
} from '../packages/core/onboarding.ts';

const details = {
  name: 'Empresa de teste',
  trade_name: 'Oficina de teste',
  postal_code: '01234000',
  street: 'Rua A',
  street_number: '1',
  district: 'Centro',
  city: 'São Paulo',
  state_code: 'SP',
  phone: '+551133330000',
  whatsapp: '+5511999990000',
  email: 'empresa@example.invalid',
  hours: 'Seg a sex',
};
test('Normalização de cadastro e convite compartilhado', () => {
  assert.deepEqual(
    normalizeFields({ postal_code: '01234-000', phone: '+55 (11) 3333-0000', state_code: ' sp ' }),
    { postal_code: '01234000', phone: '+551133330000', state_code: 'SP' }
  );
  for (const step of workshopSteps) assert.equal(validateFields(step.fields, details), '');
  assert.ok(validateFields(workshopSteps[1].fields, { ...details, latitude: '-23' }));
  assert.equal(
    inviteCode('https://example.invalid/motorista#convite=' + 'a'.repeat(64)),
    'a'.repeat(64)
  );
  assert.equal(inviteCode('incompleto'), '');
});

test('Contratos da etapa 2 em PostgreSQL, com identidade injetada apenas no teste', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    alter default privileges in schema public grant all on tables to authenticated,anon;
    alter default privileges in schema public grant execute on functions to authenticated,anon;`);
  for (const file of ['001_core.sql', '002_portals.sql', '003_onboarding.sql'])
    await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
  const email = (n) => 'p' + n + '@example.invalid';
  for (const n of [1, 2, 3, 4, 5, 6])
    await db.query('insert into auth.users values($1,$2,case when $3 then now() end)', [
      id(n),
      email(n),
      n !== 6,
    ]);
  async function as(n) {
    await db.exec('reset role; set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id(n)]);
  }
  async function value(sql, args = []) {
    return Object.values((await db.query(sql, args)).rows[0])[0];
  }
  const register = (data = details) => value('select register_workshop($1)', [JSON.stringify(data)]);
  const contact = (shop, n) =>
    value('select create_customer($1,$2)', [
      shop,
      JSON.stringify({ name: 'Cliente ' + n, email: email(n), phone: details.phone }),
    ]);
  const issue = (shop, c) => value('select issue_invite($1,$2)', [shop, c]);
  const staff = (shop, n, role) => value('select issue_invite($1,null,$2,$3)', [shop, email(n), role]);
  const accept = (token, area = 'motorista') => value('select accept_invite($1,$2)', [token, area]);
  const snap = (area, shop = null) => value('select portal_snapshot($1,$2)', [area, shop]);
  let a, b, ca, cb, other, driverToken, staffToken;
  await t.test(
    'Acesso anônimo, identidade não confirmada e dados inválidos são rejeitados',
    async () => {
      await db.exec('set role anon');
      await assert.rejects(register(), { code: '42501' });
      await as(6);
      await assert.rejects(register(), /Confirme seu e-mail/);
      await as(1);
      await assert.rejects(register({ ...details, postal_code: '123' }), /Confira CEP/);
      assert.equal((await snap('oficina')).shops.length, 0);
    }
  );
  await t.test('Onboarding atômico, repetição idempotente e escopo das áreas', async () => {
    await as(1);
    a = await register();
    assert.equal(await register(), a);
    assert.equal((await snap('oficina')).shops[0].role, 'owner');
    assert.equal((await snap('motorista')).shops.length, 0);
    await as(2);
    b = await register();
    assert.notEqual(a, b);
    await assert.rejects(snap('oficina', a), /indisponível/);
    await assert.rejects(contact(a, 3), /Sem permissão/);
    await assert.rejects(staff(a, 4, 'manager'), /Somente o proprietário/);
    cb = await contact(b, 3);
    await as(1);
    ca = await contact(a, 3);
    assert.equal(await contact(a, 3), ca);
    other = await contact(a, 5);
    await assert.rejects(issue(a, cb), /indisponível/);
    await assert.rejects(staff(a, 4, 'owner'), /Somente o proprietário/);
    await assert.rejects(db.query('select token_hash from portal_invites'), { code: '42501' });
  });
  await t.test('Reemissão, identidade, finalidade, expiração e uso único', async () => {
    const first = await issue(a, ca);
    driverToken = await issue(a, ca);
    await as(3);
    await assert.rejects(accept(first), /indisponível/);
    await assert.rejects(accept(driverToken, 'oficina'), /indisponível/);
    await assert.rejects(accept('0'.repeat(64)), /indisponível/);
    await as(5);
    await assert.rejects(accept(driverToken), /indisponível/);
    await db.exec("reset role; update portal_invites set expires_at=now()-interval '1 second'");
    await as(3);
    await assert.rejects(accept(driverToken), /indisponível/);
    await as(1);
    driverToken = await issue(a, ca);
    await as(3);
    assert.equal(await accept(driverToken), a);
    await assert.rejects(accept(driverToken), /indisponível/);
    assert.equal((await snap('oficina')).shops.length, 0);
    await as(2);
    const second = await issue(b, cb);
    await as(3);
    await accept(second);
    assert.equal((await snap('motorista')).shops.length, 2);
  });
  await t.test('Veículos, agenda e OS pertencem ao contato vinculado em cada oficina', async () => {
    await db.exec('reset role');
    for (const [shop, c] of [
      [a, ca],
      [a, other],
      [b, cb],
    ]) {
      const v = await value(
        "insert into vehicles(workshop_id,customer_contact_id,make_model) values($1,$2,'Modelo') returning id",
        [shop, c]
      );
      await db.query(
        'insert into service_orders(workshop_id,customer_contact_id,vehicle_id,service_description) values($1,$2,$3,$4)',
        [shop, c, v, c]
      );
      await db.query(
        "insert into appointments(workshop_id,contact_id,description,starts_at) values($1,$2,$3,now()+interval '1 day')",
        [shop, c, c]
      );
    }
    await as(3);
    for (const [shop, c] of [
      [a, ca],
      [b, cb],
    ]) {
      const d = await snap('motorista', shop);
      assert.equal(d.vehicles.length, 1);
      assert.deepEqual(
        d.orders.map((o) => o.service_description),
        [c]
      );
      assert.deepEqual(
        d.appointments.map((ap) => ap.description),
        [c]
      );
      assert.deepEqual(d.members, []);
      assert.deepEqual(d.contacts, []);
    }
  });
  await t.test(
    'Equipe, alteração de função e revogação invalidam permissões e convites pendentes',
    async () => {
      await as(1);
      staffToken = await staff(a, 4, 'mechanic');
      await as(4);
      await accept(staffToken, 'oficina');
      assert.equal((await snap('oficina', a)).shops[0].role, 'mechanic');
      await assert.rejects(contact(a, 5), /Sem permissão/);
      await assert.rejects(staff(a, 5, 'manager'), /Somente o proprietário/);
      await as(1);
      await value("select set_staff_role($1,$2,'receptionist')", [a, id(4)]);
      await as(4);
      const pending = await issue(a, other);
      await as(1);
      await value('select set_staff_role($1,$2,null)', [a, id(4)]);
      await assert.rejects(value('select set_staff_role($1,$2,null)', [a, id(1)]), /indisponível/);
      await as(4);
      await assert.rejects(snap('oficina', a), /indisponível/);
      await as(5);
      await assert.rejects(accept(pending), /indisponível/);
    }
  );
  await t.test('Imagens privadas e escrita exclusiva do proprietário', async () => {
    const save = (shop, image) => value("select save_workshop_image($1,'logo',$2)", [shop, image]);
    await as(1);
    await assert.rejects(save(a, 'YWJj'), /JPEG/);
    await save(a, '\/9j\/2Q==');
    assert.ok((await snap('oficina', a)).images.logo);
    await as(3);
    assert.ok((await snap('motorista', a)).images.logo);
    await assert.rejects(save(a, 'abc'), /proprietário/);
    await as(2);
    await assert.rejects(snap('oficina', a), /indisponível/);
    await assert.rejects(db.query('select jpeg from workshop_images'), { code: '42501' });
  });
  await t.test(
    'Revogação pelo proprietário e separação de papéis quando a mesma pessoa também é cliente',
    async () => {
      await as(1);
      await issue(a, other);
      const [pending] = (await snap('oficina', a)).invites;
      await as(2);
      await assert.rejects(value('select revoke_portal_invite($1,$2)', [a, pending.id]), /indisponível/);
      await as(1);
      await value('select revoke_portal_invite($1,$2)', [a, pending.id]);
      assert.equal((await snap('oficina', a)).invites.length, 0);
      const token = await staff(a, 3, 'manager');
      await as(3);
      await accept(token, 'oficina');
      const team = await snap('oficina', a);
      assert.equal(team.vehicles.length, 2);
      assert.deepEqual(team.members, []);
      const driver = await snap('motorista', a);
      assert.equal(driver.vehicles.length, 1);
      assert.deepEqual(driver.contacts, []);
      assert.equal(driver.shops.find((s) => s.id === a).role, null);
      await assert.rejects(staff(a, 5, 'mechanic'), /Somente o proprietário/);
    }
  );
});
