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
  async function account(page, email) {
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome completo').fill('Pessoa de homologação');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Cadastrar e confirmar e-mail' }).click();
    await expect(page.getByLabel('Código de confirmação')).toBeVisible();
    let code = '';
    await expect
      .poll(
        async () => {
          const found = await request.get(mail + '/search', { params: { query: 'to:' + email } });
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
  } finally {
    await owner.close();
    await driver.close();
  }
});
