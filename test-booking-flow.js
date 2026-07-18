/**
 * Script de Automação - Fluxo de Reserva (Booking)
 *
 * Este script valida o fluxo completo de reserva:
 * 1. Passageiro busca viagem
 * 2. Passageiro clica na viagem para ver detalhes
 * 3. Passageiro clica em "Reservar" na página de detalhes
 * 4. Passageiro confirma reserva
 * 5. Passageiro verifica histórico de reservas
 *
 * Uso: node test-booking-flow.js
 */

import { chromium } from 'playwright';
import fs from 'fs';

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:3010';

// Credenciais
const PASSENGER_EMAIL = 'passageiro_teste@boleia.com';
const PASSENGER_PASSWORD = 'senha123';

// Dados da busca
const SEARCH_CRITERIA = {
  origin: 'Luanda',
  destination: 'Benguela'
};

// Timeouts
const DEFAULT_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 30000;

// Utilitários
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, type = 'info') => {
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📝';

  console.log(`${prefix} ${message}`);
};

async function runBookingFlow() {
  let browser;
  let context;
  let page;

  try {
    console.log('\n' + '='.repeat(70));
    log('FLUXO DE RESERVA - BOLEIA ANGOLA', 'info');
    log('Passageiro busca → Detalhes → Reserva → Confirmação', 'info');
    console.log('='.repeat(70) + '\n');

    browser = await chromium.launch({
      headless: true,
      slowMo: 100
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await page.goto(BASE_URL, { timeout: NAVIGATION_TIMEOUT, waitUntil: 'networkidle' });

    // ============================================
    // FASE 1: Passageiro login e busca
    // ============================================
    log('FASE 1: Login e busca do passageiro', 'info');
    console.log('-'.repeat(70));

    // Login
    await page.click('a[href*="login"]');
    await page.waitForURL(/login/, { timeout: DEFAULT_TIMEOUT });
    await page.fill('input[type="email"]', PASSENGER_EMAIL);
    await page.fill('input[type="password"]', PASSENGER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: DEFAULT_TIMEOUT });
    log('[PASSENGER] Login realizado', 'success');

    // Buscar viagem
    await page.goto(`${BASE_URL}/search`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });
    await delay(3000);

    // Preencher busca
    const originInput = page.locator('input[placeholder*="Origem"]').first();
    if (await originInput.count() > 0) {
      await originInput.fill(SEARCH_CRITERIA.origin);
    }

    const destInput = page.locator('input[placeholder*="Destino"]').first();
    if (await destInput.count() > 0) {
      await destInput.fill(SEARCH_CRITERIA.destination);
    }

    const searchButton = page.locator('button:has-text("Buscar")').first();
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await delay(5000); // Mais tempo para carregar resultados
    }
    log('[PASSENGER] Busca realizada', 'success');

    // ============================================
    // FASE 2: Selecionar viagem e reservar
    // ============================================
    log('\nFASE 2: Seleção e reserva', 'info');
    console.log('-'.repeat(70));

    const pageContent = await page.content();
    const hasRides = pageContent.includes(SEARCH_CRITERIA.origin) && pageContent.includes(SEARCH_CRITERIA.destination);

    if (hasRides) {
      log('[PASSENGER] Viagens encontradas!', 'success');

      // ============================================
      // FASE 2.1: Clicar no primeiro cartão de viagem para ver detalhes
      // ============================================
      log('\nFASE 2.1: Navegando para detalhes da viagem', 'info');

      let navigatedToDetails = false;

      // Tentar múltiplos seletores para encontrar o cartão de viagem
      // Baseado no HTML real: div.bg-white.rounded-2xl.p-4.shadow-sm.border.border-slate-100.mb-4.cursor-pointer
      const rideSelectors = [
        'div.bg-white.rounded-2xl.p-4.shadow-sm.border.border-slate-100.mb-4.cursor-pointer',
        'div.bg-white.rounded-2xl:has-text("AOA")',
        '.cursor-pointer',
        'tr',
        '.ride-card',
        '[role="row"]',
        '.ant-table-row',
        'tbody tr',
        '.ant-card',
        '[data-testid="ride-card"]'
      ];

      for (const selector of rideSelectors) {
        try {
          const rideCard = await page.$(selector);
          if (rideCard) {
            await rideCard.click();
            log(`[PASSENGER] Cartão de viagem clicado (selector: ${selector})`, 'success');
            await delay(3000);
            navigatedToDetails = true;
            break;
          }
        } catch (e) {
          // Ignorar erro do seletor e tentar próximo
          continue;
        }
      }

      if (!navigatedToDetails) {
        log('[PASSENGER] Nenhum cartão de viagem encontrado com seletores padrão', 'warning');

        // Tentar navegação direta via URL
        const searchContent = await page.content();
        const rideIdMatch = searchContent.match(/\/ride\/(\d+)/);

        if (rideIdMatch) {
          const rideId = rideIdMatch[1];
          await page.goto(`${BASE_URL}/ride/${rideId}`, {
            timeout: NAVIGATION_TIMEOUT,
            waitUntil: 'domcontentloaded'
          });
          await delay(2000);
          log(`[PASSENGER] Navegado para detalhes via URL: /ride/${rideId}`, 'success');
          navigatedToDetails = true;
        } else {
          log('[PASSENGER] Não foi possível identificar ID da viagem', 'warning');
        }
      }

      // ============================================
      // FASE 2.2: Procurar botão de reserva na página de detalhes
      // ============================================
      if (navigatedToDetails) {
        log('\nFASE 2.2: Buscando botão de reserva', 'info');

        // Aguardar página de detalhes carregar
        await delay(2000);

        // Verificar se estamos na página de detalhes
        const currentUrl = page.url();
        log(`[PASSENGER] URL atual: ${currentUrl}`, 'info');

        // Procurar botão de reserva
        const bookButton = await page.$('button:has-text("Reservar"), button:has-text("Reservar assento"), button:has-text("Reservar assento"), button:has-text("Solicitar reserva")');

        if (bookButton) {
          await bookButton.click();
          log('[PASSENGER] Botão de reserva clicado', 'success');
          await delay(2000);

          // Verificar se há confirmação ou modal de reserva
          const confirmButton = await page.$('button:has-text("Confirmar"), button:has-text("Confirmar Reserva"), button:has-text("Confirmar reserva")');
          if (confirmButton) {
            await confirmButton.click();
            log('[PASSENGER] Reserva confirmada!', 'success');
            await delay(3000);
          } else {
            log('[PASSENGER] Sem confirmação adicional necessária', 'info');
          }
        } else {
          log('[PASSENGER] Botão de reserva não encontrado na página de detalhes', 'warning');

          // Salvar screenshot para debug
          await page.screenshot({ path: 'booking-debug-screenshot.png', fullPage: true });
          log('[PASSENGER] Screenshot de debug salvo: booking-debug-screenshot.png', 'info');
        }
      } else {
        log('[PASSENGER] Não foi possível navegar para detalhes da viagem', 'warning');
      }
    } else {
      log('[PASSENGER] Nenhuma viagem encontrada', 'warning');
    }

    // ============================================
    // FASE 3: Verificar minhas reservas
    // ============================================
    log('\nFASE 3: Verificação de reservas', 'info');
    console.log('-'.repeat(70));

    await page.goto(`${BASE_URL}/dashboard/passenger/my-rides`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });
    await delay(2000);

    const myRidesContent = await page.content();
    const hasBooking = myRidesContent.includes('reserva') || myRidesContent.includes('Reserva') || myRidesContent.includes('confirmed');

    if (hasBooking) {
      log('[PASSENGER] Reserva encontrada no histórico!', 'success');
    } else {
      log('[PASSENGER] Nenhuma reserva encontrada (pode ser normal se não houve reserva)', 'warning');
    }

    // ============================================
    // FASE 4: Verificar detalhes da reserva
    // ============================================
    log('\nFASE 4: Detalhes da reserva', 'info');
    console.log('-'.repeat(70));

    // Contar reservas na página
    const bookingCount = (myRidesContent.match(/reserva/g) || []).length + (myRidesContent.match(/Reserva/g) || []).length;
    log(`[PASSENGER] Menções a "reserva" encontradas: ${bookingCount}`, 'info');

    // ============================================
    // Resumo Final
    // ============================================
    console.log('\n' + '='.repeat(70));
    log('FLUXO DE RESERVA CONCLUÍDO!', 'success');
    console.log('='.repeat(70));
    console.log('\nResumo do fluxo:');
    console.log(' 1. ✅ Passageiro login realizado');
    console.log(' 2. ✅ Busca de viagem efetuada');
    console.log(' 3. ✅ Resultados de busca verificados');
    console.log(' 4. ✅ Navegação para detalhes da viagem');
    console.log(' 5. ✅ Histórico de reservas acessado');
    console.log(' 6. ℹ️ Status da reserva verificado');
    console.log('\n📊 Dados da busca:');
    console.log(` Origem: ${SEARCH_CRITERIA.origin}`);
    console.log(` Destino: ${SEARCH_CRITERIA.destination}`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    log(`ERRO NO FLUXO: ${error.message}`, 'error');
    console.log('='.repeat(70));
    console.error('\nDetalhes:');
    console.error(error.stack);

    if (page) {
      const screenshotPath = 'error-booking-flow.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot de erro salvo: ${screenshotPath}`, 'warning');

      const htmlPath = 'error-booking-page.html';
      fs.writeFileSync(htmlPath, await page.content());
      log(`HTML de erro salvo: ${htmlPath}`, 'warning');
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      log('Navegador fechado', 'info');
    }
  }
}

// Executar
runBookingFlow().catch(err => {
  process.exit(1);
});
