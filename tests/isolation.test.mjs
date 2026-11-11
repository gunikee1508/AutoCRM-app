import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

test('Migrações e isolamento dos portais', async t => {
  const db = new PGlite({ extensions: { pgcrypto } });
  t.after(() => db.close());
  // Substitui somente o contrato do Supabase Auth. As políticas rodam no PostgreSQL.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    alter default privileges in schema public grant all on tables to authenticated, anon;
    alter default privileges in schema public grant execute on functions to authenticated, anon;
  `);
  for (const file of ['001_core.sql', '002_portals.sql']) {
    await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  }
  const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
  for (const n of [1, 2, 3, 4, 5]) {
    await db.query('insert into auth.users values ($1)', [id(n)]);
    await db.query('insert into profiles(id) values ($1)', [id(n)]);
  }
  for (const [n, shop, customer] of [[1,1,3], [2,2,4], [3,1,5]]) {
    if (n < 3) {
      await db.query("insert into workshops(id,name) values ($1,'Oficina teste')", [id(shop)]);
      await db.query("insert into workshop_members values ($1,$2,'owner',now())", [id(shop),id(n)]);
    }
    await db.query("insert into customer_contacts(id,workshop_id,user_id,name,email) values ($1,$2,$3,'Cliente','teste@example.invalid')", [id(n),id(shop),id(customer)]);
    await db.query("insert into vehicles(id,workshop_id,customer_contact_id,make_model) values ($1,$2,$1,'Veículo')", [id(n),id(shop)]);
    await db.query("insert into service_orders(id,workshop_id,customer_contact_id,vehicle_id,service_description) values ($1,$2,$1,$1,'Revisão')", [id(n),id(shop)]);
  }
  await t.test('OS exige veículo do cliente na mesma oficina', async () => {
    await assert.rejects(db.query('update service_orders set vehicle_id=$1 where id=$2',[id(3),id(1)]), {code:'23503'});
  });
  await t.test('Aviso de retirada respeita consentimento e WhatsApp pessoal', async () => {
    await db.exec("update service_orders set status='ready'");
    assert.equal((await db.query('select id from notification_jobs')).rows.length,0);
    await db.query("update customer_contacts set service_message_allowed=true, phone_e164='+5500000000000' where id=$1", [id(1)]);
    await db.query("update service_orders set status='progress' where id=$1", [id(1)]);
    await db.query("update service_orders set status='ready' where id=$1", [id(1)]);
    await db.query("update service_orders set status='ready' where id=$1", [id(1)]);
    assert.deepEqual((await db.query('select channel from notification_jobs')).rows,[{channel:'email'}]);
  });
  await db.exec('set role anon');
  await t.test('Consulta anônima negada', async () => {
    await assert.rejects(db.query('select id from service_orders'), {code:'42501'});
  });
  await db.exec('reset role; set role authenticated');
  for (const [user, expected] of [[1,[1,3]],[2,[2]],[3,[1]],[4,[2]],[5,[3]]]) {
    await t.test('Visibilidade da conta ' + user, async () => {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id(user)]);
      assert.deepEqual((await db.query('select id from service_orders order by id')).rows.map(r=>r.id), expected.map(id));
      await assert.rejects(db.query("update service_orders set status='ready'"), {code:'42501'});
      await assert.rejects(db.query('select email from customer_contacts'), {code:'42501'});
      await assert.rejects(db.query('select id from notification_jobs'), {code:'42501'});
    });
  }
});
