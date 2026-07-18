import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('deve permitir registro de novo usuário', async ({ page }) => {
    await page.goto('/');

    // Click no botão de login/registro
    await page.click('text=Entrar');

    // Preencher formulário de registro
    await page.fill('input[name="email"]', `test_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Senha123!');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="phone"]', '+244923456789');

    // Submeter
    await page.click('button:has-text("Registrar")');

    // Aguardar sucesso
    await expect(page.locator('text=Bem-vindo')).toBeVisible();
  });

  test('deve permitir login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');

    // Preencher credenciais
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Senha123!');

    // Submeter
    await page.click('button:has-text("Entrar")');

    // Verificar redirecionamento
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Minha Conta')).toBeVisible();
  });

  test('deve exibir erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    // Preencher credenciais inválidas
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrong-password');

    // Submeter
    await page.click('button:has-text("Entrar")');

    // Verificar erro
    await expect(page.locator('text=Senha incorreta')).toBeVisible();
  });

  test('deve permitir logout', async ({ page }) => {
    await page.goto('/');

    // Fazer login
    await page.click('text=Entrar');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Senha123!');
    await page.click('button:has-text("Entrar")');

    // Logout
    await page.click('text=Minha Conta');
    await page.click('text=Sair');

    // Verificar logout
    await expect(page.locator('text=Entrar')).toBeVisible();
  });
});
