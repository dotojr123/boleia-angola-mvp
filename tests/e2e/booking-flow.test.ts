import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Senha123!');
    await page.click('button:has-text("Entrar")');
  });

  test('deve buscar viagens com origem e destino', async ({ page }) => {
    await page.goto('/');

    // Preencher busca
    await page.fill('input[name="origin"]', 'Luanda');
    await page.fill('input[name="destination"]', 'Benguela');
    await page.fill('input[name="date"]', '2026-04-20');

    // Submeter busca
    await page.click('button:has-text("Pesquisar")');

    // Verificar resultados
    await expect(page.locator('[data-testid="ride-card"]')).toBeVisible();
  });

  test('deve visualizar detalhes da viagem', async ({ page }) => {
    await page.goto('/search?origin=Luanda&destination=Benguela');

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="ride-card"]');

    // Clicar no primeiro card
    await page.click('[data-testid="ride-card"]:first-child');

    // Verificar detalhes
    await expect(page.locator('text=Motorista')).toBeVisible();
    await expect(page.locator('text=Veículo')).toBeVisible();
    await expect(page.locator('text=Preço')).toBeVisible();
  });

  test('deve reservar assento em viagem', async ({ page }) => {
    await page.goto('/search?origin=Luanda&destination=Benguela');

    await page.waitForSelector('[data-testid="ride-card"]');
    await page.click('[data-testid="ride-card"]:first-child');

    // Clicar em reservar
    await page.click('button:has-text("Reservar")');

    // Confirmar reserva
    await page.click('button:has-text("Confirmar")');

    // Verificar sucesso
    await expect(page.locator('text=Reserva confirmada')).toBeVisible();
  });

  test('deve visualizar minhas reservas', async ({ page }) => {
    await page.goto('/minhas-viagens');

    await expect(page.locator('text=Minhas Reservas')).toBeVisible();
    await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();
  });

  test('deve cancelar reserva', async ({ page }) => {
    await page.goto('/minhas-viagens');

    await page.waitForSelector('[data-testid="booking-card"]');

    // Clicar em cancelar
    await page.click('[data-testid="booking-card"]:first-child button:has-text("Cancelar")');

    // Confirmar cancelamento
    await page.click('button:has-text("Sim, cancelar")');

    // Verificar cancelamento
    await expect(page.locator('text=Reserva cancelada')).toBeVisible();
  });
});
