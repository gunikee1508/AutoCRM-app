import { createClient } from '@supabase/supabase-js';
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Run only against the local Supabase + Mailpit stack, using disposable accounts.
test('Cadastro confirmado, login por senha e vínculo no Supabase local', async ({
  browser,
  request,
  baseURL,
}) => {
  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!endpoint || !['localhost', '127.0.0.1'].includes(new URL(endpoint).hostname))
    throw Error(
      'Configure NEXT_PUBLIC_SUPABASE_URL para o Supabase local e compile a web antes deste teste.'
    );
  const health = await request.get(endpoint + '/auth/v1/health', {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '' },
  });
  expect(health.ok()).toBe(true);
  const run = randomUUID();
  const password = randomUUID() + 'aA9!';
  const mail = 'http://127.0.0.1:54324/api/v1';
  const owner = await browser.newPage({ baseURL });
  const driver = await browser.newPage({ baseURL });
  const staff = await browser.newPage({ baseURL });
  async function readCode(email, subject) {
    let code = '';
    await expect
      .poll(
        async () => {
          const found = await request.get(mail + '/search', {
            params: { query: 'to:' + email + ' subject:' + subject },
          });
          const message = (await found.json()).messages?.find((m) =>
            m.To.some((a) => a.Address === email)
          );
          if (!message) return false;
          const body = await (await request.get(mail + '/message/' + message.ID)).json();
          code = body.HTML?.match(/<strong>(\d{6,10})<\/strong>/i)?.[1] || '';
          return Boolean(code);
        },
        { timeout: 30000 }
      )
      .toBe(true);
    return code;
  }
  async function account(page, email) {
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome completo').fill('Pessoa de homologação');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Cadastrar e confirmar e-mail' }).click();
    await expect(page.getByLabel('Código de confirmação')).toBeVisible();
    const code = await readCode(email, 'Confirme');
    await page.getByLabel('Código de confirmação').fill(code);
    await page.getByRole('button', { name: 'Confirmar e-mail', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible();
  }
  try {
    const ownerEmail = 'owner-' + run + '@example.com';
    const driverEmail = 'driver-' + run + '@example.com';
    await owner.goto('/oficina');
    await account(owner, ownerEmail);
    await owner.getByRole('button', { name: 'Sair da conta' }).click();
    await owner.getByLabel('E-mail', { exact: true }).fill(ownerEmail);
    await owner.getByLabel('Senha', { exact: true }).fill(password);
    await owner.getByRole('button', { name: 'Entrar', exact: true }).click();
    await owner.getByRole('button', { name: 'Cadastrar minha oficina' }).click();
    async function fill(fields) {
      for (const [label, value] of Object.entries(fields))
        await owner.getByLabel(label, { exact: true }).fill(value);
    }
    await fill({ 'Razão social': 'Oficina de homologação', 'Nome fantasia': 'Oficina ' + run });
    await owner.getByRole('button', { name: 'Continuar' }).click();
    await fill({
      CEP: '01234000',
      'Rua ou avenida': 'Rua A',
      Número: '12',
      Bairro: 'Centro',
      Cidade: 'São Paulo',
      UF: 'SP',
    });
    await owner.getByRole('button', { name: 'Continuar' }).click();
    await fill({
      'Telefone comercial': '+551133330000',
      'WhatsApp comercial': '+5511999990000',
      'E-mail comercial': ownerEmail,
      'Horários de funcionamento': 'Segunda a sexta',
    });
    await owner.getByRole('button', { name: 'Cadastrar oficina', exact: true }).click();
    await owner.getByRole('button', { name: 'Clientes e convites' }).click();
    await fill({
      'Nome do cliente': 'Motorista de homologação',
      Telefone: '+5511999990001',
      'E-mail do cliente': driverEmail,
    });
    await owner.getByRole('button', { name: 'Cadastrar cliente' }).click();
    await owner.getByRole('button', { name: 'Gerar convite de motorista' }).click();
    const link = await owner.getByLabel('Link de uso único').inputValue();
    await driver.goto(link);
    await account(driver, driverEmail);
    await driver.getByRole('button', { name: 'Confirmar vínculo' }).click();
    await expect(driver.getByRole('heading', { name: 'Oficina ' + run })).toBeVisible();
    await expect(driver.getByRole('button', { name: 'Gerenciar equipe' })).toHaveCount(0);
    await driver.reload();
    await expect(driver.getByRole('heading', { name: 'Oficina ' + run })).toBeVisible();
    await owner.reload();
    await owner.getByRole('button', { name: 'Gerenciar equipe' }).click();
    const staffEmail = 'staff-' + run + '@example.com';
    await owner.getByLabel('E-mail do funcionário').fill(staffEmail);
    await owner.getByRole('button', { name: 'Gerar convite de equipe' }).click();
    await staff.goto(await owner.getByLabel('Link de uso único').inputValue());
    await account(staff, staffEmail);
    await staff.getByRole('button', { name: 'Confirmar vínculo' }).click();
    await expect(staff.getByRole('heading', { name: 'Oficina ' + run })).toBeVisible();

    // Ordinary end-user sessions against the disposable local API.
    async function api(email) {
      const client = createClient(endpoint, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
      return client;
    }
    const mechanic = await api(staffEmail);
    const customer = await api(driverEmail);
    const board = await mechanic.rpc('portal_snapshot', { area: 'oficina' });
    expect(board.error).toBeNull();
    const shop = board.data.selected;
    const another = await customer.rpc('register_workshop', {
      details: {
        name: 'Segunda oficina',
        trade_name: 'Outra ' + run,
        postal_code: '01234000',
        state_code: 'SP',
        street: 'Rua B',
        street_number: '2',
        district: 'Centro',
        city: 'São Paulo',
        phone: '+551133330000',
        whatsapp: '+5511999990000',
        email: driverEmail,
        hours: 'Segunda a sexta',
      },
    });
    expect(another.error).toBeNull();
    expect(
      (await mechanic.rpc('portal_snapshot', { area: 'oficina', selected: another.data })).error
    ).toBeTruthy();
    expect(
      (await customer.rpc('portal_snapshot', { area: 'oficina', selected: shop })).error
    ).toBeTruthy();
    expect(
      (await customer.from('workshops').update({ hours: 'Homologação' }).eq('id', shop)).error?.code
    ).toBe('42501');
    expect(
      (await mechanic.from('workshop_members').update({ role: 'manager' }).eq('workshop_id', shop)).error
        ?.code
    ).toBe('42501');
    await owner.reload();
    await owner.getByRole('button', { name: 'Gerenciar equipe' }).click();
    await owner.getByRole('button', { name: 'Gerenciar acesso' }).click();
    await owner.getByRole('button', { name: 'Revogar acesso à oficina' }).click();
    await expect
      .poll(
        async () =>
          (await mechanic.rpc('portal_snapshot', { area: 'oficina', selected: shop })).error?.message
      )
      .toMatch(/indisponível/);
    await staff.reload();
    await expect(staff.getByRole('heading', { name: 'Comece pela sua oficina' })).toBeVisible();

    await driver.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(driver.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
    await driver.reload();
    await driver.getByRole('button', { name: 'Esqueci minha senha' }).click();
    await driver.getByLabel('E-mail de recuperação').fill(driverEmail);
    await driver.getByRole('button', { name: 'Enviar código', exact: true }).click();
    await driver.getByLabel('Código de recuperação').fill(await readCode(driverEmail, 'Recupere'));
    await driver.getByRole('button', { name: 'Verificar código' }).click();
    const updated = randomUUID() + 'aA1!';
    await driver.getByLabel('Nova senha', { exact: true }).fill(updated);
    await driver.getByLabel('Confirme a nova senha').fill(updated);
    await driver.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(driver.getByText('Senha alterada com sucesso.')).toBeVisible();
    expect(
      (await customer.auth.signInWithPassword({ email: driverEmail, password })).error
    ).toBeTruthy();
    expect(
      (await customer.auth.signInWithPassword({ email: driverEmail, password: updated })).error
    ).toBeNull();
  } finally {
    await staff.close();
    await owner.close();
    await driver.close();
  }
});
