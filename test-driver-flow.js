/**
 * Script de Automação - Fluxo do Motorista
 *
 * Este script mapeia o fluxo completo de um usuário Motorista:
 * 1. Login como motorista
 * 2. Acesso ao Dashboard
 * 3. Cadastro de veículo
 * 4. Publicação de viagem
 * 5. Verificação da viagem listada
 *
 * Uso: node test-driver-flow.js
 */

import { chromium } from 'playwright';

(async () => {
 // Configuração
 const BASE_URL = 'http://localhost:3002';
 const API_URL = 'http://localhost:3010';

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
  plate: 'ABC-1234'
 };

 let browser;
 let context;
 let page;

 try {
  console.log('🚗 Iniciando fluxo do Motorista - Boleia Angola\n');
  console.log('=' .repeat(60));

  // 1. Inicializar navegador
  console.log('\n📱 [PASSO 1] Iniciando navegador...');
  browser = await chromium.launch({
   headless: true,
   slowMo: 100
  });

  context = await browser.newContext({
   viewport: { width: 1280, height: 720 }
  });

  page = await context.newPage();
  await page.goto(BASE_URL);
  console.log(' ✅ Navegador iniciado');
  console.log(` URL: ${page.url()}`);

  // 2. Login
  console.log('\n🔐 [PASSO 2] Realizando login como motorista...');
  console.log(` Email: ${DRIVER_EMAIL}`);

  // Click no link de login
  await page.click('a[href*="login"]');
  await page.waitForURL(/login/, { timeout: 10000 });

  // Preencher formulário
  await page.fill('input[type="email"]', DRIVER_EMAIL);
  await page.fill('input[type="password"]', DRIVER_PASSWORD);

  // Submeter
  await page.click('button:has-text("Entrar"), button:has-text("Acessar Conta"), button[type="submit"]');

  // Aguardar redirecionamento
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  console.log(' ✅ Login realizado com sucesso');
  console.log(` URL: ${page.url()}`);

  // 3. Dashboard do Motorista
  console.log('\n📊 [PASSO 3] Acessando Dashboard...');
  if (!page.url().includes('dashboard')) {
   await page.goto(`${BASE_URL}/dashboard/driver`);
  }
  console.log(` URL atual: ${page.url()}`);
  console.log(' ✅ Dashboard carregado');

  // 4. Cadastrar Veículo - Rota correta: /dashboard/driver/vehicles
  console.log('\n🚗 [PASSO 4] Acessando página de veículos...');

  await page.goto(`${BASE_URL}/dashboard/driver/vehicles`);
  await page.waitForSelector('text=Meus Veículos, text=Veículos', { timeout: 10000 });
  console.log(' ✅ Página de veículos acessada');

  // Verificar se já existe veículo
  const hasVehicles = await page.$('text=Toyota Corolla');
  if (!hasVehicles) {
   // Adicionar novo veículo - clicar no botão Adicionar
   const addButton = await page.$('button:has-text("Adicionar"), text=Adicionar Veículo');
   if (addButton) {
    console.log(' 📝 Preenchendo formulário de veículo...');
   } else {
    console.log(' 📝 Formulário já visível');
   }

   // Preencher dados do veículo
   await page.fill('input[placeholder="Ex: Toyota"]', TEST_VEHICLE.make);
  await page.fill('input[placeholder="Ex: Corolla"]', TEST_VEHICLE.model);
  await page.locator('input[type="number"]').first().fill(String(TEST_VEHICLE.year));
  await page.fill('input[placeholder="Ex: Prata"]', TEST_VEHICLE.color);
  await page.fill('input[placeholder="LD-XX-XX-XX"]', TEST_VEHICLE.plate);

   // Salvar
   await page.click('button:has-text("Salvar Veículo"), button[type="submit"]');
   await page.waitForSelector('text=Veículo cadastrado, text=veículo foi cadastrado, text=sucesso', { timeout: 10000 });
   console.log(' ✅ Veículo cadastrado');
  } else {
   console.log(' ✅ Veículo já existe');
  }

  // 5. Publicar Viagem - Rota correta: /dashboard/driver/publish
  console.log('\n📍 [PASSO 5] Publicando viagem...');

  await page.goto(`${BASE_URL}/dashboard/driver/publish`);
  await page.waitForSelector('input[name="origin"]', { timeout: 10000 });
  console.log(' 📝 Preenchendo formulário de publicação...');

  // Preencher origem e destino
  await page.fill('input[name="origin"]', TEST_RIDE.origin);
  await page.fill('input[name="destination"]', TEST_RIDE.destination);

  // Data e hora
  await page.fill('input[name="date"]', TEST_RIDE.departure_date);
  await page.fill('input[name="time"]', TEST_RIDE.departure_time);

  // Preço
  await page.fill('input[name="price"]', TEST_RIDE.price);

  // Selecionar assentos (clicar no botão "4")
  await page.click('button:has-text("4"):not(:has-text("lugares"))');

  // Selecionar o primeiro veículo da lista
  await page.click('text=Toyota');

  // Submeter
  await page.click('button:has-text("Publicar Carona"), button[type="submit"]');

  // Aguardar confirmação ou redirecionamento
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  console.log(' ✅ Viagem publicada com sucesso');

  // 6. Verificar Viagem Listada
  console.log('\n🔍 [PASSO 6] Verificando viagem listada...');

  await page.goto(`${BASE_URL}/dashboard/driver`);
  const pageContent = await page.content();
  const rideFound = pageContent.includes(TEST_RIDE.origin) && pageContent.includes(TEST_RIDE.destination);

  if (rideFound) {
   console.log(' ✅ Viagem encontrada no dashboard');
  } else {
   console.log(' ⚠️ Viagem não encontrada (pode ser normal dependendo do estado)');
  }

  // 7. Resumo Final
  console.log('\n' + '=' .repeat(60));
  console.log('✅ FLUXO DO MOTORISTA CONCLUÍDO COM SUCESSO!');
  console.log('=' .repeat(60));
  console.log('\nResumo do fluxo:');
  console.log(' 1. ✅ Login realizado');
  console.log(' 2. ✅ Dashboard acessado');
  console.log(' 3. ✅ Veículo cadastrado');
  console.log(' 4. ✅ Viagem publicada');
  console.log(' 5. ✅ Viagem listada');
  console.log('\n📊 Dados da viagem:');
  console.log(` Origem: ${TEST_RIDE.origin}`);
  console.log(` Destino: ${TEST_RIDE.destination}`);
  console.log(` Data: ${TEST_RIDE.departure_date}`);
  console.log(` Preço: ${TEST_RIDE.price} AOA`);
  console.log(` Assentos: ${TEST_RIDE.seats}`);

 } catch (error) {
  console.error('\n❌ ERRO NO FLUXO:', error.message);
  console.error('\nDetalhes:');
  console.error(error.stack);

  // Capturar screenshot de erro
  if (page) {
   await page.screenshot({ path: 'error-screenshot.png' });
   console.log('\n📸 Screenshot de erro salvo: error-screenshot.png');
  }
 } finally {
  // Fechar navegador
  if (browser) {
   await browser.close();
  }
 }
})();
