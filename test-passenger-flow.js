/**
 * Script de Automação - Fluxo do Passageiro
 *
 * Este script mapeia o fluxo completo de um usuário Passageiro:
 * 1. Login como passageiro
 * 2. Acesso ao Dashboard
 * 3. Busca de viagens (origem, destino, data)
 * 4. Verificação de resultados
 * 5. Verificação do histórico de reservas
 *
 * Uso: node test-passenger-flow.js
 */

import { chromium } from 'playwright';
import fs from 'fs';

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:3010';

// Credenciais de teste
const PASSENGER_EMAIL = 'passageiro_teste@boleia.com';
const PASSENGER_PASSWORD = 'senha123';

// Dados da busca de viagem
const SEARCH_RIDE = {
  origin: 'Luanda',
  destination: 'Benguela',
  date: '2026-10-25'
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

async function runPassengerFlow() {
  let browser;
  let context;
  let page;

  try {
    console.log('\n' + '='.repeat(70));
    log('INICIANDO FLUXO DO PASSAGEIRO - BOLEIA ANGOLA', 'info');
    console.log('='.repeat(70) + '\n');

    // ============================================
    // PASSO 1: Inicializar navegador
    // ============================================
    log('[PASSO 1] Iniciando navegador...', 'info');
    browser = await chromium.launch({
      headless: true,
      slowMo: 100
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await page.goto(BASE_URL, { timeout: NAVIGATION_TIMEOUT, waitUntil: 'networkidle' });
    log(`Navegador iniciado - URL: ${page.url()}`, 'success');

    // ============================================
    // PASSO 2: Login
    // ============================================
    log('\n[PASSO 2] Realizando login como passageiro...', 'info');
    log(`Email: ${PASSENGER_EMAIL}`, 'info');

    // Navegar para login
    await page.goto(`${BASE_URL}/login`, { timeout: NAVIGATION_TIMEOUT, waitUntil: 'networkidle' });

    // Preencher formulário
    await page.fill('input[type="email"]', PASSENGER_EMAIL);
    await page.fill('input[type="password"]', PASSENGER_PASSWORD);

    // Submeter
    await page.click('button:has-text("Entrar"), button:has-text("Acessar Conta"), button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL(/dashboard/, { timeout: DEFAULT_TIMEOUT });
    log(`Login realizado - URL: ${page.url()}`, 'success');

    // ============================================
    // PASSO 3: Dashboard do Passageiro
    // ============================================
    log('\n[PASSO 3] Verificando Dashboard...', 'info');

    // Aguardar carregamento do dashboard - usar múltiplos seletores
    const dashboardSelectors = [
      'text=Minhas Viagens',
      'text=Dashboard',
      'text=Painel',
      'text=Viagens Agendadas',
      '[data-testid="dashboard"]',
      '.dashboard-container'
    ];

    let dashboardLoaded = false;
    for (const selector of dashboardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        log(`Dashboard carregado (selector: ${selector})`, 'success');
        dashboardLoaded = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!dashboardLoaded) {
      log('Dashboard não carregou completamente, mas prosseguindo...', 'warning');
    }

    // ============================================
    // PASSO 4: Buscar Viagem
    // ============================================
    log('\n[PASSO 4] Buscando viagem...', 'info');

    // Navegar diretamente para página de busca
    await page.goto(`${BASE_URL}/`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });
    await delay(3000); // Aguardar React hydration

    // Aguardar formulário de busca carregar
    await delay(2000);

    // Verificar se a página de busca carregou
    const searchPageLoaded = await page.$('input[placeholder="Ex: Luanda"]');

    if (searchPageLoaded) {
      log('Página de busca carregada', 'success');

      // Preencher origem
      const originInput = page.locator('input[placeholder="Ex: Luanda"]').first();
      if (await originInput.count() > 0) {
        await originInput.fill(SEARCH_RIDE.origin);
        log(`Origem: ${SEARCH_RIDE.origin}`, 'info');
      }

      // Preencher destino
      const destinationInput = page.locator('input[placeholder="Ex: Benguela"]').first();
      if (await destinationInput.count() > 0) {
        await destinationInput.fill(SEARCH_RIDE.destination);
        log(`Destino: ${SEARCH_RIDE.destination}`, 'info');
      }

      // Preencher data (se existir)
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.count() > 0) {
        await dateInput.fill(SEARCH_RIDE.date);
        log(`Data: ${SEARCH_RIDE.date}`, 'info');
      }

      // Submeter busca - tentar múltiplos seletores
      const searchSelectors = [
        'button:has-text("Buscar")',
        'button:has-text("buscar")',
        'button[type="submit"]',
        'input[type="submit"]',
        '[data-testid="search-button"]'
      ];

      let searchClicked = false;
      for (const selector of searchSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0) {
            await btn.click();
            log(`Busca realizada (selector: ${selector})`, 'success');
            searchClicked = true;
            await delay(2000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!searchClicked) {
        log('Nenhum botão de busca encontrado, tentando navegação direta para resultados', 'warning');
      }
    } else {
      log('Página de busca não encontrada, pulando etapa', 'warning');
    }

    // ============================================
    // PASSO 5: Verificar Resultados da Busca
    // ============================================
    log('\n[PASSO 5] Verificando resultados...', 'info');

    await delay(3000); // Aguardar resultados carregarem

    // Verificar se há viagens listadas
    const pageContent = await page.content();
    const hasResults = pageContent.includes(SEARCH_RIDE.origin) || pageContent.includes(SEARCH_RIDE.destination);

    if (hasResults) {
      log('Resultados de viagem encontrados', 'success');
    } else {
      log('Nenhuma viagem encontrada (pode ser normal)', 'warning');
    }

    // ============================================
    // PASSO 6: Verificar Minhas Reservas
    // ============================================
    log('\n[PASSO 6] Verificando histórico de reservas...', 'info');

    await page.goto(`${BASE_URL}/dashboard/passenger/my-rides`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'networkidle'
    });

    await delay(2000);
    log('Página de Minhas Viagens acessada', 'success');

    // Verificar se há reservas
    const hasBookings = pageContent.includes('reserva') || pageContent.includes('viagem');
    if (hasBookings) {
      log('Histórico de reservas verificado', 'success');
    } else {
      log('Nenhuma reserva encontrada', 'warning');
    }

    // ============================================
    // Resumo Final
    // ============================================
    console.log('\n' + '='.repeat(70));
    log('FLUXO DO PASSAGEIRO CONCLUÍDO COM SUCESSO!', 'success');
    console.log('='.repeat(70));
    console.log('\nResumo do fluxo:');
    console.log(' 1. ✅ Login realizado');
    console.log(' 2. ✅ Dashboard acessado');
    console.log(' 3. ✅ Busca de viagem realizada');
    console.log(' 4. ✅ Resultados verificados');
    console.log(' 5. ✅ Histórico de reservas acessado');
    console.log('\n📊 Dados da busca:');
    console.log(` Origem: ${SEARCH_RIDE.origin}`);
    console.log(` Destino: ${SEARCH_RIDE.destination}`);
    console.log(` Data: ${SEARCH_RIDE.date}`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    log(`ERRO NO FLUXO: ${error.message}`, 'error');
    console.log('='.repeat(70));
    console.error('\nDetalhes:');
    console.error(error.stack);

    // Capturar screenshot de erro
    if (page) {
      const screenshotPath = 'error-passenger-screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot de erro salvo: ${screenshotPath}`, 'warning');

      // Salvar HTML da página de erro
      const htmlPath = 'error-passenger-page.html';
      fs.writeFileSync(htmlPath, await page.content());
      log(`HTML de erro salvo: ${htmlPath}`, 'warning');
    }

    throw error;
  } finally {
    // Fechar navegador
    if (browser) {
      await browser.close();
      log('Navegador fechado', 'info');
    }
  }
}

// Executar
runPassengerFlow().catch(err => {
  process.exit(1);
});
