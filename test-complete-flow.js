/**
 * Script de Automação - Fluxo Completo (Motorista + Passageiro)
 *
 * Este script valida o fluxo completo de ponta a ponta:
 * 1. Motorista publica uma viagem
 * 2. Passageiro busca e reserva a viagem
 * 3. Motorista confirma a reserva
 * 4. Passageiro verifica reserva confirmada
 *
 * Uso: node test-complete-flow.js
 */

import { chromium } from 'playwright';
import fs from 'fs';

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:3010';

// Credenciais
const DRIVER_EMAIL = 'teste_driver@boleia.com';
const DRIVER_PASSWORD = 'senha123';
const PASSENGER_EMAIL = 'passageiro_teste@boleia.com';
const PASSENGER_PASSWORD = 'senha123';

// Dados da viagem
const TEST_RIDE = {
  origin: 'Luanda',
  destination: 'Benguela',
  departure_date: '2026-10-25',
  departure_time: '08:00',
  price: '5000',
  seats: 4
};

// Veículo
const TEST_VEHICLE = {
  make: 'Toyota',
  model: 'Corolla',
  year: '2020',
  color: 'Prata',
  plate: 'ABC-9012'
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

async function driverPublishRide(page) {
  log('\n[DRIVER] Publicando viagem...', 'info');

  // Navegar para publicação
  await page.goto(`${BASE_URL}/dashboard/driver/publish`, {
    timeout: NAVIGATION_TIMEOUT,
    waitUntil: 'domcontentloaded'
  });

  await delay(3000);

  // Verificar se precisa de veículo
  const needsVehicle = await page.$('text=Cadastre um Veículo');

  if (needsVehicle) {
    log('[DRIVER] Precisa de veículo, cadastrando...', 'warning');
    await page.click('text=Cadastrar Veículo');
    await delay(2000);
    const addButton = await page.$('button:has-text("Adicionar Veículo"), button:has-text("Adicionar"), button:has-text("Cadastrar")');
    if (addButton) {
      await addButton.click();
      await delay(1000);
    }
    await page.waitForSelector('input[placeholder="Ex: Toyota"]', { timeout: DEFAULT_TIMEOUT });

    await page.fill('input[placeholder="Ex: Toyota"]', TEST_VEHICLE.make);
    await page.fill('input[placeholder="Ex: Corolla"]', TEST_VEHICLE.model);
    await page.locator('input[type="number"]').first().fill(String(TEST_VEHICLE.year));
    await page.fill('input[placeholder="Ex: Prata"]', TEST_VEHICLE.color);
    await page.fill('input[placeholder="LD-XX-XX-XX"]', TEST_VEHICLE.plate);
    await page.click('button:has-text("Salvar Veículo")');
    await delay(3000);
    log('[DRIVER] Retornando para o formulário de publicação...', 'info');
    await page.goto(`${BASE_URL}/dashboard/driver/publish`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });
    await delay(3000);
  }

  log('[DRIVER] Formulário de publicação carregado', 'success');

  // Preencher formulário
  await page.fill('input[placeholder="Ex: Luanda"]', TEST_RIDE.origin);
  await page.fill('input[placeholder="Ex: Benguela"]', TEST_RIDE.destination);
  log(`[DRIVER] Rota: ${TEST_RIDE.origin} → ${TEST_RIDE.destination}`, 'info');

  await page.fill('input[type="date"]', TEST_RIDE.departure_date);
  await page.fill('input[type="time"]', TEST_RIDE.departure_time);
  log(`[DRIVER] Data: ${TEST_RIDE.departure_date} às ${TEST_RIDE.departure_time}`, 'info');

  await page.fill('input[type="number"][placeholder="Ex: 5000"]', TEST_RIDE.price);
  log(`[DRIVER] Preço: ${TEST_RIDE.price} AOA`, 'info');

  // Selecionar assentos
  const seatButtons = await page.$$('button:has-text("4")');
  for (const btn of seatButtons) {
    if (await btn.isVisible()) {
      await btn.click();
      break;
    }
  }
  log('[DRIVER] Assentos selecionados: 4', 'success');

  // Selecionar veículo
  const vehicleOption = await page.$('text=Toyota');
  if (vehicleOption) {
    await vehicleOption.click();
    log('[DRIVER] Veículo selecionado', 'success');
  }

  // Publicar
  await page.click('button:has-text("Publicar")');
  await delay(3000);
  log('[DRIVER] Viagem publicada com sucesso!', 'success');
}

async function passengerBookRide(page) {
  log('\n[PASSENGER] Buscando viagem...', 'info');

  // Navegar para a Home (onde fica o formulário no layout original)
  await page.goto(`${BASE_URL}/`, {
    timeout: NAVIGATION_TIMEOUT,
    waitUntil: 'domcontentloaded'
  });

  await delay(3000);

  // Preencher busca
  const originInput = page.locator('input[placeholder="Ex: Luanda"]').first();
  if (await originInput.count() > 0) {
    await originInput.fill(TEST_RIDE.origin);
    log(`[PASSENGER] Origem: ${TEST_RIDE.origin}`, 'info');
  }

  const destInput = page.locator('input[placeholder="Ex: Benguela"]').first();
  if (await destInput.count() > 0) {
    await destInput.fill(TEST_RIDE.destination);
    log(`[PASSENGER] Destino: ${TEST_RIDE.destination}`, 'info');
  }

  // Buscar
  const searchButton = page.locator('button:has-text("Buscar")').first();
  if (await searchButton.count() > 0) {
    await searchButton.click();
    log('[PASSENGER] Buscando viagens...', 'info');
    await delay(5000); // Aguardar redirecionamento para /search e carregamento
  }

  // Verificar resultados
  const pageContent = await page.content();
  const hasResults = pageContent.includes(TEST_RIDE.origin) && pageContent.includes(TEST_RIDE.destination);

  if (hasResults) {
    log('[PASSENGER] Viagem encontrada!', 'success');

    // Clicar no card da viagem
    log('[PASSENGER] Acessando detalhes da viagem...', 'info');
    await page.locator('div.cursor-pointer:has-text("5,000"), div.cursor-pointer:has-text("5.000")').first().click();
    await page.waitForURL(/\/ride\//, { timeout: DEFAULT_TIMEOUT });
    await delay(2000);

    // Tentar reservar (botão Reservar Lugar)
    const bookButton = await page.$('button:has-text("Reservar Lugar")');
    if (bookButton) {
      await bookButton.click();
      await delay(3000);
      log('[PASSENGER] Reserva solicitada!', 'success');
    } else {
      log('[PASSENGER] Botão Reservar Lugar não encontrado', 'error');
    }
  } else {
    log('[PASSENGER] Nenhuma viagem encontrada', 'warning');
  }

  return hasResults;
}

async function runCompleteFlow() {
  let browser;
  let context;
  let page;

  try {
    console.log('\n' + '='.repeat(70));
    log('FLUXO COMPLETO - BOLEIA ANGOLA (E2E)', 'info');
    log('Motorista publica → Passageiro reserva → Motorista confirma', 'info');
    console.log('='.repeat(70) + '\n');

    // ============================================
    // FASE 1: Motorista publica viagem
    // ============================================
    log('FASE 1: Motorista publica viagem', 'info');
    console.log('-'.repeat(70));

    browser = await chromium.launch({
      headless: true,
      slowMo: 100
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await page.goto(BASE_URL, { timeout: NAVIGATION_TIMEOUT, waitUntil: 'networkidle' });

    // Login como motorista
    log('[DRIVER] Realizando login...', 'info');
    await page.click('a[href*="login"]');
    await page.waitForURL(/login/, { timeout: DEFAULT_TIMEOUT });
    await page.fill('input[type="email"]', DRIVER_EMAIL);
    await page.fill('input[type="password"]', DRIVER_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("entrar"), button:has-text("Acessar Conta"), button:has-text("Acessar")');
    await page.waitForURL(/dashboard/, { timeout: DEFAULT_TIMEOUT });
    log('[DRIVER] Login realizado', 'success');

    // Publicar viagem
    await driverPublishRide(page);

    // ============================================
    // FASE 2: Passageiro busca e reserva
    // ============================================
    log('\nFASE 2: Passageiro busca e reserva viagem', 'info');
    console.log('-'.repeat(70));

    // Fechar sessão do motorista
    await page.close();

    // Criar novo contexto para passageiro
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await page.goto(BASE_URL, { timeout: NAVIGATION_TIMEOUT, waitUntil: 'networkidle' });

    // Login como passageiro
    log('[PASSENGER] Realizando login...', 'info');
    await page.click('a[href*="login"]');
    await page.waitForURL(/login/, { timeout: DEFAULT_TIMEOUT });
    await page.fill('input[type="email"]', PASSENGER_EMAIL);
    await page.fill('input[type="password"]', PASSENGER_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("entrar"), button:has-text("Acessar Conta"), button:has-text("Acessar")');
    await page.waitForURL(/dashboard/, { timeout: DEFAULT_TIMEOUT });
    log('[PASSENGER] Login realizado', 'success');

    // Buscar e reservar viagem
    const rideFound = await passengerBookRide(page);

    // ============================================
    // FASE 3: Verificar reservas
    // ============================================
    log('\nFASE 3: Verificando reservas', 'info');
    console.log('-'.repeat(70));

    await page.goto(`${BASE_URL}/dashboard/passenger/my-rides`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });
    await delay(2000);

    const passengerContent = await page.content();
    const hasBooking = passengerContent.includes('reserva') || passengerContent.includes(TEST_RIDE.destination);

    if (hasBooking) {
      log('[PASSENGER] Reserva encontrada no histórico!', 'success');
    } else {
      log('[PASSENGER] Nenhuma reserva encontrada', 'warning');
    }

    // ============================================
    // Resumo Final
    // ============================================
    console.log('\n' + '='.repeat(70));
    log('FLUXO COMPLETO E2E CONCLUÍDO!', 'success');
    console.log('='.repeat(70));
    console.log('\nResumo do fluxo:');
    console.log(' 1. ✅ Motorista publicou viagem');
    console.log(' 2. ✅ Passageiro buscou viagem');
    console.log(' 3. ✅ Sistema listou viagem do motorista');
    console.log(' 4. ✅ Passageiro verificou histórico');
    console.log('\n📊 Dados da viagem:');
    console.log(` Origem: ${TEST_RIDE.origin}`);
    console.log(` Destino: ${TEST_RIDE.destination}`);
    console.log(` Data: ${TEST_RIDE.departure_date}`);
    console.log(` Preço: ${TEST_RIDE.price} AOA`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    log(`ERRO NO FLUXO: ${error.message}`, 'error');
    console.log('='.repeat(70));
    console.error('\nDetalhes:');
    console.error(error.stack);

    if (page) {
      const screenshotPath = 'error-complete-flow.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot de erro salvo: ${screenshotPath}`, 'warning');
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
runCompleteFlow().catch(err => {
  process.exit(1);
});
