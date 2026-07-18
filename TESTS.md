# 🧪 Guia de Testes - Boleia Angola

## Visão Geral

Este documento descreve a infraestrutura de testes e o fluxo automatizado do projeto Boleia Angola.

---

## 📋 Stack de Testes

| Camada | Ferramenta | Descrição |
|--------|------------|-----------|
| **Backend** | Jest + Supertest | Testes unitários e de integração da API |
| **Frontend** | Vitest + React Testing Library | Testes de componentes React |
| **E2E** | Playwright | Testes end-to-end nos navegadores |
| **Coverage** | c8 / Istanbul | Relatório de cobertura de testes |

---

## 🚀 Comandos Disponíveis

### Backend
```bash
cd server

# Rodar testes
npm test

# Rodar em modo watch
npm run test:watch

# Rodar com coverage
npm run test:coverage
```

### Frontend
```bash
# Rodar testes
npm test

# Rodar com UI
npm run test:ui

# Rodar com coverage
npm run test:coverage
```

### E2E
```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar com UI
npx playwright test --ui
```

### Todos os testes
```bash
# Script unificado
./scripts/run-tests.sh
```

---

## 📁 Estrutura de Arquivos

```
/boleia-angola/
├── tests/
│   ├── unit/                    # Testes unitários
│   │   ├── components/          # Componentes React
│   │   └── utils/               # Funções utilitárias
│   ├── integration/             # Testes de integração
│   │   └── api.test.ts          # Integração com API
│   └── e2e/                     # Testes E2E
│       ├── auth-flow.test.ts    # Fluxo de autenticação
│       ├── booking-flow.test.ts # Fluxo de reserva
│       └── driver-flow.test.ts  # Fluxo do motorista
├── server/tests/
│   ├── unit/                    # Testes unitários backend
│   │   ├── auth.test.js         # Auth API
│   │   ├── rides.test.js        # Rides API
│   │   └── bookings.test.js     # Bookings API
│   └── integration/             # Testes de integração
├── scripts/
│   ├── run-tests.sh             # Script principal
│   ├── validate-results.sh      # Validação
│   └── retrigger-implementation.sh  # Re-correção
├── .github/workflows/
│   ├── test-on-push.yml         # CI: Test on push
│   ├── validate-on-test.yml     # CI: Validate
│   └── deploy-on-success.yml    # CD: Deploy on success
├── vitest.config.ts             # Config Vitest
├── jest.config.js               # Config Jest
└── playwright.config.ts         # Config Playwright
```

---

## 🔄 Fluxo Automatizado

### Hook 1: onImplementationComplete
**Gatilho:** Implementação de feature ou correção  
**Ação:** Aciona execução de testes

```bash
# Automático via git push
git push origin feature-branch

# Ou manual
./scripts/run-tests.sh
```

### Hook 2: onTestsComplete
**Gatilho:** Todos os testes executados  
**Ação:** Valida resultados

```bash
# Validação automática
./scripts/validate-results.sh
```

### Hook 3: onValidationComplete
**Gatilho:** Validação concluída  
**Decisão:**
- ✅ 100% sucesso → Deploy
- ❌ Falha → Loop de correção

---

## 📊 Critérios de Aprovação

| Tipo | Cobertura Mínima | Status |
|------|-----------------|--------|
| Backend | 80% | Obrigatório |
| Frontend | 70% | Obrigatório |
| Integração | 90% | Obrigatório |
| E2E | Fluxos críticos | Obrigatório |

---

## 🧪 Testes Implementados

### Backend (Jest)
- [x] Auth API (register, login)
- [x] Rides API (list, create, read)
- [x] Bookings API (create, update status)
- [ ] Vehicles API
- [ ] Messages API
- [ ] Admin API

### Frontend (Vitest)
- [x] SearchFilters component
- [x] RideCard component
- [ ] PublishRide component
- [ ] Dashboard components

### E2E (Playwright)
- [x] Auth flow (register, login, logout)
- [x] Booking flow (search, reserve, cancel)
- [x] Driver flow (publish, manage)

---

## 🔧 Configuração

### Variáveis de Ambiente (Test)
```bash
# .env.test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boleia_test
DB_USER=test
DB_PASSWORD=test
JWT_SECRET=test_jwt_secret
```

### Banco de Dados de Teste
```sql
CREATE DATABASE boleia_test;
```

---

## 📝 Boas Práticas

1. **Nomes descritivos:** `it('deve retornar erro para senha inválida')`
2. **Um teste por assert:** Evite múltiplas assertivas complexas
3. **Setup/teardown:** Use beforeEach/afterEach para limpar estado
4. **Mocks:** Mocke dependências externas (API, DB)
5. **Coverage:** Mantenha cobertura mínima de 80%

---

## 🐛 Troubleshooting

### Testes falhando
```bash
# Verificar logs
cat test-results/backend-results.json
cat test-results/frontend-results.json

# Re-rodar específico
npm test -- auth.test.js
```

### Coverage baixo
```bash
# Verificar relatório HTML
open coverage/index.html
```

---

## 📈 Próximos Passos

1. Implementar testes de Vehicles API
2. Implementar testes de Messages API
3. Adicionar testes de Admin API
4. Criar testes de integração DB
5. Configurar CI/CD completo

---

**Última atualização:** 2026-04-13
