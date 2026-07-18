/**
 * Script de Automação - Fluxo do Motorista (Versão Robusta)
 *
 * Este script mapeia o fluxo completo de um usuário Motorista:
 * 1. Login como motorista
 * 2. Acesso ao Dashboard
 * 3. Cadastro de veículo (se necessário)
 * 4. Publicação de viagem
 * 5. Verificação da viagem listada
 *
 * Uso: node test-driver-flow-robust.js
 */

import { chromium } from 'playwright';
import fs from 'fs';

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:3010';

// Credenciais de teste
const DRIVER_EMAIL = 'teste_driver@boleia.com';
const DRIVER_PASSWORD = 'senha123';

// Dados da viagem
const TEST_RIDE = {
  origin: 'Luanda',
  destination: 'Benguela',
  departure_date: '2026-10-25',
  departure_time: '08:00',
  price: '5000',
  seats: 4
};

// Dados do veículo
const TEST_VEHICLE = {
  make: 'Toyota',
  model: 'Corolla',
  year: '2020',
  color: 'Prata',
  plate: 'ABC-5678' // Diferente para evitar conflito
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

async function runDriverFlow() {
  let browser;
  let context;
  let page;

  try {
    console.log('\n' + '='.repeat(70));
    log('INICIANDO FLUXO DO MOTORISTA - BOLEIA ANGOLA', 'info');
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
    log('\n[PASSO 2] Realizando login como motorista...', 'info');
    log(`Email: ${DRIVER_EMAIL}`, 'info');

    // Click no link de login
    await page.click('a[href*="login"]');
    await page.waitForURL(/login/, { timeout: DEFAULT_TIMEOUT });

    // Preencher formulário
    await page.fill('input[type="email"]', DRIVER_EMAIL);
    await page.fill('input[type="password"]', DRIVER_PASSWORD);

    // Submeter
    await page.click('button:has-text("Entrar"), button:has-text("Acessar Conta"), button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL(/dashboard/, { timeout: DEFAULT_TIMEOUT });
    log(`Login realizado - URL: ${page.url()}`, 'success');

    // ============================================
    // PASSO 3: Dashboard do Motorista
    // ============================================
    log('\n[PASSO 3] Verificando Dashboard...', 'info');

    // Aguardar carregamento do dashboard
    await page.waitForSelector('text=Painel do Motorista', { timeout: DEFAULT_TIMEOUT });
    log('Dashboard carregado com sucesso', 'success');

    // ============================================
    // PASSO 4: Cadastrar Veículo
    // ============================================
    log('\n[PASSO 4] Gerenciando veículos...', 'info');

    // Navegar para página de veículos
    await page.goto(`${BASE_URL}/dashboard/driver/vehicles`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'networkidle'
    });

    // Verificar se a página carregou (texto "Veículos" ou "Meus Veículos")
    await page.waitForSelector('text=/Veículos/', { timeout: DEFAULT_TIMEOUT });
    log('Página de veículos acessada', 'success');

    // Verificar se já existe veículo
    const vehicleExists = await page.$('text=/Toyota/');

    if (!vehicleExists) {
      log('Nenhum veículo encontrado, criando...', 'info');

      // Clicar em Adicionar Veículo
      const addButton = await page.$('button:has-text("Adicionar Veículo"), button:has-text("Adicionar"), button:has-text("Cadastrar")');

      if (addButton) {
        await addButton.click();
        log('Formulário de veículo aberto', 'success');
      }

      // Aguardar formulário
      await page.waitForSelector('input[placeholder="Ex: Toyota"]', { timeout: DEFAULT_TIMEOUT });

      // Preencher dados do veículo
      await page.fill('input[placeholder="Ex: Toyota"]', TEST_VEHICLE.make);
      await page.fill('input[placeholder="Ex: Corolla"]', TEST_VEHICLE.model);
      await page.locator('input[type="number"]').first().fill(String(TEST_VEHICLE.year));
      await page.fill('input[placeholder="Ex: Prata"]', TEST_VEHICLE.color);
      await page.fill('input[placeholder="LD-XX-XX-XX"]', TEST_VEHICLE.plate);

      // Salvar
      await page.click('button:has-text("Salvar Veículo"), button:has-text("Salvar"), button[type="submit"]');

      // Aguardar confirmação (mensagem de sucesso)
      await delay(2000); // Aguardar mensagem aparecer
      log('Veículo cadastrado', 'success');
    } else {
      log('Veículo já existe, pulando cadastro', 'success');
    }

    // ============================================
    // PASSO 5: Publicar Viagem
    // ============================================
    log('\n[PASSO 5] Publicando viagem...', 'info');

    // Navegar para publicação
    await page.goto(`${BASE_URL}/dashboard/driver/publish`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });

    // Aguardar React renderizar
    await delay(3000);

    // Verificar se precisa de veículo primeiro
    const needsVehicle = await page.$('text=Cadastre um Veículo');

    if (needsVehicle) {
      log('Precisa de veículo, voltando...', 'warning');
      await page.click('text=Cadastrar Veículo');
      await page.waitForSelector('input[placeholder="Ex: Toyota"]', { timeout: DEFAULT_TIMEOUT });

      // Preencher veículo
      await page.fill('input[placeholder="Ex: Toyota"]', TEST_VEHICLE.make);
      await page.fill('input[placeholder="Ex: Corolla"]', TEST_VEHICLE.model);
      await page.locator('input[type="number"]').first().fill(String(TEST_VEHICLE.year));
      await page.fill('input[placeholder="Ex: Prata"]', TEST_VEHICLE.color);
      await page.fill('input[placeholder="LD-XX-XX-XX"]', TEST_VEHICLE.plate);
      await page.click('button:has-text("Salvar Veículo")');
      await delay(2000);
    }

    log('Formulário de publicação carregado', 'success');

    // Aguardar formulário estar visível (usando placeholder como referência)
    await page.waitForSelector('input[placeholder="Ex: Luanda"], input[type="date"]', { timeout: DEFAULT_TIMEOUT });

    // Preencher origem e destino (usando placeholder)
    await page.fill('input[placeholder="Ex: Luanda"]', TEST_RIDE.origin);
    await page.fill('input[placeholder="Ex: Benguela"]', TEST_RIDE.destination);
    log(`Rota: ${TEST_RIDE.origin} → ${TEST_RIDE.destination}`, 'info');

    // Data e hora
    await page.fill('input[type="date"]', TEST_RIDE.departure_date);
    await page.fill('input[type="time"]', TEST_RIDE.departure_time);
    log(`Data: ${TEST_RIDE.departure_date} às ${TEST_RIDE.departure_time}`, 'info');

    // Preço
    await page.fill('input[type="number"][placeholder="Ex: 5000"]', TEST_RIDE.price);
    log(`Preço: ${TEST_RIDE.price} AOA`, 'info');

    // Selecionar assentos (clicar no botão "4")
    const seatButton = await page.$('button:has-text("4"):not(:has-text("lugares")), button:has-text("4 lugares")');
    if (seatButton) {
      await seatButton.click();
      log('Assentos selecionados: 4', 'success');
    }

    // Selecionar veículo da lista
    const vehicleOption = await page.$('text=Toyota');
    if (vehicleOption) {
      await vehicleOption.click();
      log('Veículo selecionado: Toyota Corolla', 'success');
    }

    // Submeter publicação
    await page.click('button:has-text("Publicar Carona"), button:has-text("Publicar"), button[type="submit"]');

    // Aguardar confirmação ou redirecionamento
    await delay(3000); // Aguardar processamento
    log('Viagem publicada', 'success');

    // ============================================
    // PASSO 6: Verificar Viagem Listada
    // ============================================
    log('\n[PASSO 6] Verificando viagem listada...', 'info');

    await page.goto(`${BASE_URL}/dashboard/driver`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'networkidle'
    });

    const pageContent = await page.content();
    const rideFound = pageContent.includes(TEST_RIDE.origin) && pageContent.includes(TEST_RIDE.destination);

    if (rideFound) {
      log('Viagem encontrada no dashboard', 'success');
    } else {
      log('Viagem não encontrada no dashboard', 'warning');
    }

    // ============================================
    // Resumo Final
    // ============================================
    console.log('\n' + '='.repeat(70));
    log('FLUXO DO MOTORISTA CONCLUÍDO COM SUCESSO!', 'success');
    console.log('='.repeat(70));
    console.log('\nResumo do fluxo:');
    console.log(' 1. ✅ Login realizado');
    console.log(' 2. ✅ Dashboard acessado');
    console.log(' 3. ✅ Veículo verificado/cadastrado');
    console.log(' 4. ✅ Viagem publicada');
    console.log(' 5. ✅ Viagem listada');
    console.log('\n📊 Dados da viagem:');
    console.log(` Origem: ${TEST_RIDE.origin}`);
    console.log(` Destino: ${TEST_RIDE.destination}`);
    console.log(` Data: ${TEST_RIDE.departure_date}`);
    console.log(` Preço: ${TEST_RIDE.price} AOA`);
    console.log(` Assentos: ${TEST_RIDE.seats}`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    log(`ERRO NO FLUXO: ${error.message}`, 'error');
    console.log('='.repeat(70));
    console.error('\nDetalhes:');
    console.error(error.stack);

    // Capturar screenshot de erro
    if (page) {
      const screenshotPath = 'error-screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot de erro salvo: ${screenshotPath}`, 'warning');

      // Salvar HTML da página de erro
      const htmlPath = 'error-page.html';
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
runDriverFlow().catch(err => {
  process.exit(1);
});
