import { test, expect } from '@playwright/test';

for (const area of ['oficina', 'motorista']) {
  test('Entrada e recuperação de senha · ' + area, async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'Requer build com a configuração pública da API.');
    await page.goto('/' + area);
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await expect(
      page.getByRole('heading', {
        name: area === 'oficina' ? 'Crie sua conta profissional' : 'Crie sua conta gratuita',
      })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Já tenho conta confirmada' }).click();
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    await page.getByRole('button', { name: 'Enviar código' }).click();
    await expect(page.getByRole('status')).toContainText('Confira o e-mail informado.');
    await page.getByRole('button', { name: 'Voltar ao login' }).click();
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  });
}
