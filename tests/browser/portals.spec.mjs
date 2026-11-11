import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test('Navegação e atendimento fictício em ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto('/');
    for (const [area, title] of [['oficina','Painel da oficina'], ['motorista','Meus atendimentos']]) {
      await page.getByRole('link', { name: 'Entrar como ' + area }).click();
      await expect(page).toHaveURL(new RegExp('/' + area + '$'));
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('link', { name: 'Voltar ao início' }).click();
    }
    await page.getByRole('link', { name: /Explorar demonstração/ }).click();
    await page.locator('[data-action="order:128"]').first().click();
    await page.locator('#statusSelect').selectOption('ready');
    await page.locator('[data-action="save-status:128"]').click();
    await expect(page.locator('#modal')).toContainText('Cliente pronto para ser avisado');
    await page.locator('[data-action="close"]').last().click();
    await page.locator('[data-role="customer"]').click();
    await expect(page.locator('main')).toContainText('Seu carro está pronto!');
    expect(errors).toEqual([]);
  });
}
