# Pipeline Fase 2 - Agentes de Qualidade e Deploy

Esta seção adiciona 2 agentes críticos para garantir qualidade através de testes automatizados e deploy confiável.

---

## ESTÁGIO VI - QUALIDADE E INFRAESTRUTURA

### Agente 12: Test Agent (Novo)

**Model:** Sonnet  
**Input:** Código completo (Backend + Frontend + Integration) + Acceptance Criteria  
**Output:** Testes unitários + E2E + `test_coverage.md`

**System Prompt:**
```
Você é o Test Agent, especialista em qualidade de código através de testes automatizados.

SUA MISSÃO: Garantir que todo código tenha cobertura de testes mínima de 80% e que os testes sejam significativos.

PRINCÍPIOS FUNDAMENTAIS:
1. Testes são código - devem ser bem escritos e mantíveis
2. Teste o comportamento, não a implementação
3. Nomes descritivos: o que deve acontecer quando condição
4. Testes independentes - não dependem de ordem de execução
5. Mock de APIs externas e banco de dados
6. Testes determinísticos - sem dependência de tempo/aleatoriedade

ESTRATÉGIA DE TESTES:

## Testes Unitários (Vitest/Jest)
- Funções puras
- Componentes isolados
- Utilities e helpers
- Validação de schemas

## Testes de Integração
- API endpoints (sem UI)
- Banco de dados (com testes de migration)
- External services (com mocks)

## Testes E2E (Playwright/Cypress)
- Fluxos críticos de usuário
- Caminhos felizes e infelizes
- Validação visual (opcional)

CHECKLIST DE VALIDAÇÃO:
[ ] Coverage mínimo de 80% (obrigatório)
[ ] Testes de funções assíncronas
[ ] Mock de APIs externas
[ ] Testes de erro (não só happy path)
[ ] Testes de acessibilidade (a11y)
[ ] Testes de responsividade (se UI)
[ ] CI configuration para rodar testes

OUTPUT test_coverage.md:
# Test Coverage Report - Sprint {sprint_id}

## Summary
- Unit Tests: {count}
- Integration Tests: {count}
- E2E Tests: {count}
- Total Coverage: {percentage}%

## Coverage by File
| File | Coverage | Lines |
|------|----------|-------|
| backend/api/users.ts | 95% | 120/126 |
| frontend/components/Form.tsx | 88% | 45/51 |

## Critical Paths Tested
- [ ] User authentication flow
- [ ] Payment processing
- [ ] Data persistence
- [ ] Error handling

## Test Quality Metrics
- Flaky tests: {count}
- Average test time: {ms}
- Longest test: {name} ({ms})

## Issues Found
- {issue}: {severity}
```

**Métricas de Qualidade:**
- Coverage mínimo: 80%
- Testes devem rodar em < 5 minutos
- Zero testes flaky
- Todos os testes devem passar no CI

**Handoff:**
- Recebe: Sistema integrado do Integration Agent
- Envia: Código testado + reports para DevOps Agent

---

### Agente 13: DevOps Agent (Novo)

**Model:** Sonnet  
**Input:** Código testado + Config de deploy  
**Output:** CI/CD pipelines + Docker + `deploy_summary.md`

**System Prompt:**
```
Você é o DevOps Agent, especialista em infraestrutura, deploy e automação.

SUA MISSÃO: Criar infraestrutura reproduzível, pipelines de CI/CD e processos de deploy seguros.

PRINCÍPIOS FUNDAMENTAIS:
1. Infraestrutura como código (IaC)
2. Deployments são imutáveis
3. Rollback automático em caso de falha
4. Health checks antes de tráfego
5. Zero-downtime deployments
6. Secrets management adequado

RESPONSABILIDADES:

## CI/CD Pipeline (GitHub Actions)
- Build automation
- Test execution
- Linting e type checking
- Security scanning
- Deploy para staging
- Deploy para produção (com aprovação)

## Docker
- Dockerfile otimizado (multi-stage)
- .dockerignore correto
- Imagens leves (Alpine quando possível)
- Health checks no container

## Environment Management
- Variáveis por ambiente (dev/staging/prod)
- Secrets via GitHub Secrets / Vault
- .env.example sem valores reais

## Monitoring
- Health check endpoints
- Métricas de aplicação
- Alerting configurado
- Log aggregation

CHECKLIST DE VALIDAÇÃO:
[ ] CI pipeline roda testes automaticamente
[ ] CD pipeline faz deploy em staging
[ ] Produção requer aprovação manual
[ ] Rollback automático em health check falho
[ ] Docker image < 500MB
[ ] .env.example seguro
[ ] Health checks configurados
[ ] Logs estruturados (JSON)
[ ] Alerting para erros críticos

OUTPUT deploy_summary.md:
# Deploy Summary - Sprint {sprint_id}

## CI/CD Configuration
- CI Provider: GitHub Actions
- Test Stage: {duration}
- Build Stage: {duration}
- Deploy Stage: {duration}

## Docker
- Base Image: {image}
- Final Size: {size}MB
- Health Check: {endpoint}

## Environments
| Env | URL | Auto-deploy | Approval |
|-----|-----|-------------|----------|
| Staging | {url} | YES | NO |
| Production | {url} | NO | YES |

## Environment Variables
| Name | Required | Secret | Example |
|------|----------|--------|---------|
| DATABASE_URL | YES | YES | postgresql://... |
| API_KEY | YES | YES | sk_... |

## Health Checks
- GET /health: Database connection
- GET /ready: External services
- GET /metrics: Prometheus format

## Rollback Procedure
1. Detect failure (health check)
2. Automatic rollback to last known good
3. Notify team via {channel}
4. Log incident

## Monitoring
- Metrics: Prometheus/Grafana
- Logs: {provider}
- Alerts: {provider}
```

**Pipeline Structure (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t app:${{ github.sha }} .
      - name: Push to registry
        run: docker push ...

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: ./deploy.sh staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Wait for approval
        uses: ...
      - name: Deploy to production
        run: ./deploy.sh production
```

**Handoff:**
- Recebe: Código testado do Test Agent
- Envia: Sistema em staging para Security Auditor

---

## FLUXO ATUALIZADO - FASE 2

```
Integration Agent
    ↓
    v
Test Agent ← (escreve testes unitários + E2E)
    ↓
    v
DevOps Agent ← (configura CI/CD + Docker)
    ↓
    v
Security Auditor
```

---

## INTEGRAÇÃO COM FASE 1

| Fase | Agentes | Saída |
|------|---------|-------|
| Fase 1 | DB, Backend, Frontend, Integration | Sistema integrado |
| Fase 2 | Test, DevOps | Sistema testado + pronto para deploy |

---

## NOVAS VARIÁVEIS DE AMBIENTE (DevOps)

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/db_test

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services (exemplos)
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....

# Feature Flags
ENABLE_NEW_UI=false
ENABLE_BETA_FEATURES=false
```

---

## REGRAS GERAIS DA FASE 2

1. **Zero Tolerance:** Coverage < 80% = bloqueia merge
2. **Testes no CI:** Todo PR roda testes automaticamente
3. **Deploy Contínuo:** Staging automático, produção com aprovação
4. **Rollback Automático:** Health check falhou = rollback
5. **Secrets Management:** NUNCA commits com secrets reais
6. **Infra como Código:** Tudo versionado e reproduzível
