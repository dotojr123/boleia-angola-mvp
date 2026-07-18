import { test, expect } from '@playwright/test';

test.describe('Driver Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como motorista
    await page.goto('/login');
    await page.fill('input[name="email"]', 'driver@example.com');
    await page.fill('input[name="password"]', 'Senha123!');
    await page.click('button:has-text("Entrar")');
  });

  test('deve publicar nova viagem', async ({ page }) => {
    await page.goto('/publicar-viagem');

    // Preencher formulário
    await page.fill('input[name="origin"]', 'Luanda');
    await page.fill('input[name="destination"]', 'Benguela');
    await page.fill('input[name="date"]', '2026-04-20');
    await page.fill('input[name="time"]', '08:00');
    await page.fill('input[name="price"]', '5000');
    await page.fill('input[name="seats"]', '4');

    // Selecionar veículo
    await page.selectOption('select[name="vehicle"]', 'car-1');

    // Publicar
    await page.click('button:has-text("Publicar")');

    // Verificar sucesso
    await expect(page.locator('text=Viagem publicada')).toBeVisible();
  });

  test('deve visualizar minhas viagens publicadas', async ({ page }) => {
    await page.goto('/minhas-viagens');

    await expect(page.locator('text=Minhas Viagens')).toBeVisible();
    await expect(page.locator('[data-testid="driver-ride-card"]')).toBeVisible();
  });

  test('deve aceitar reserva de passageiro', async ({ page }) => {
    await page.goto('/minhas-viagens');

    await page.waitForSelector('[data-testid="pending-booking"]');
    await page.click('[data-testid="pending-booking"]:first-child button:has-text("Aceitar")');

    await expect(page.locator('text=Reserva aceita')).toBeVisible();
  });

  test('deve recusar reserva de passageiro', async ({ page }) => {
    await page.goto('/minhas-viagens');

    await page.waitForSelector('[data-testid="pending-booking"]');
    await page.click('[data-testid="pending-booking"]:first-child button:has-text("Recusar")');
    await page.click('button:has-text("Confirmar recusa")');

    await expect(page.locator('text=Reserva recusada')).toBeVisible();
  });

  test('deve adicionar veículo', async ({ page }) => {
    await page.goto('/meus-veiculos');

    await page.click('button:has-text("Adicionar Veículo")');

    // Preencher dados do veículo
    await page.fill('input[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Corolla');
    await page.fill('input[name="year"]', '2020');
    await page.fill('input[name="color"]', 'Prata');
    await page.fill('input[name="plate"]', 'LD-12-34-AB');

    // Salvar
    await page.click('button:has-text("Salvar")');

    await expect(page.locator('text=Veículo adicionado')).toBeVisible();
  });
});
