# Template: Self-Modifying Instructions

Estes arquivos são a **camada de memória de longo prazo** do sistema. O Orquestrador deve atualizá-los após cada ciclo completo do pipeline.

---

## agents.md — Regras Aprendidas por Agente

```markdown
# Regras de Agente (Self-Modifying Layer)
# Formato: [DATA] [AGENTE]: [REGRA APRENDIDA]
# Origem: erros recorrentes, preferências do cliente, incidentes de produção

## Discovery Agent
- [YYYY-MM-DD] Discovery: Sempre perguntar sobre integrações de pagamento explicitamente; clientes frequentemente esquecem de mencionar Stripe.
- [YYYY-MM-DD] Discovery: Se o cliente mencionar "dashboard", mapear quais métricas devem aparecer antes de avançar.

## PRD Generator
- [YYYY-MM-DD] PRD: Escopo Negativo deve vir ANTES dos Requisitos Funcionais para ancorar expectativas.
- [YYYY-MM-DD] PRD: User Stories de Admin são frequentemente esquecidas — sempre perguntar sobre roles de usuário.

## Spec Generator
- [YYYY-MM-DD] Spec: Enums de status devem ser definidos UMA VEZ no data_model e referenciados — nunca redefinidos na API Spec.
- [YYYY-MM-DD] Spec: Endpoints de webhook de pagamento exigem validação de assinatura Stripe — incluir como critério de aceite obrigatório.

## DB Agent
- [YYYY-MM-DD] DB: Sempre adicionar índice em foreign keys antes de migrar dados.
- [YYYY-MM-DD] DB: Soft delete obrigatório com trigger de created_at/updated_at automáticos.

## Backend Agent
- [YYYY-MM-DD] Backend: Inicializar cliente Supabase com service_role APENAS em operações server-side.
- [YYYY-MM-DD] Backend: Rate limiting em todos endpoints de auth (/auth/*).

## Frontend Agent
- [YYYY-MM-DD] Frontend: useEffect com chamadas de API deve incluir cleanup function para evitar memory leaks.
- [YYYY-MM-DD] Frontend: Skeleton screens preferidos sobre spinners para loading states.

## Integration Agent
- [YYYY-MM-DD] Integration: Circuit breaker obrigatório para APIs externas com timeout de 5s.
- [YYYY-MM-DD] Integration: Health check deve validar todas as dependências antes de tráfego.

## Test Agent
- [YYYY-MM-DD] Test: Mock todas APIs externas para evitar flaky tests.
- [YYYY-MM-DD] Test: Testes de integração devem isolar estado entre si.

## DevOps Agent
- [YYYY-MM-DD] DevOps: Health check obrigatório antes de tráfego em produção.
- [YYYY-MM-DD] DevOps: Rollback automático em caso de falha no deploy.

## Evaluator Agent
- [YYYY-MM-DD] Evaluator: Score mínimo elevado para 0.95 (era 0.90) após bug de race condition em produção.
- [YYYY-MM-DD] Evaluator: Testar explicitamente o logout e expiração de sessão — frequentemente esquecido.

## Security Auditor
- [YYYY-MM-DD] Security: Verificar CORS antes de qualquer teste de integração — bloqueou staging por 2 horas.
- [YYYY-MM-DD] Security: npm audit deve incluir flag --audit-level=moderate (não apenas critical).

## Performance Agent
- [YYYY-MM-DD] Performance: Imagens devem ter < 200KB após otimização.
- [YYYY-MM-DD] Performance: Lazy loading obrigatório para componentes abaixo da dobra.

## UX/Accessibility Agent
- [YYYY-MM-DD] UX: Testar com NVDA e VoiceOver antes de merge.
- [YYYY-MM-DD] UX: Focus trap obrigatório em modais.

## Documentation Agent
- [YYYY-MM-DD] Docs: README deve ter quick start de 5 minutos.
- [YYYY-MM-DD] Docs: ADRs devem documentar "porquê" das decisões, não apenas "o quê".
```

---

## cloud.md — Regras de Arquitetura e Marca

```markdown
# Regras de Arquitetura (Cloud Config)
# Estas regras são invioláveis até revisão explícita do Tech Lead

## Interface e UX
- [YYYY-MM-DD] UI: Proibido Dark Mode como padrão (Diretriz de Marca do cliente X).
- [YYYY-MM-DD] UI: Componentes de loading devem usar skeleton screens, nunca spinners genéricos.
- [YYYY-MM-DD] UI: Mensagens de erro devem ser em português (pt-BR), nunca em inglês técnico para o usuário final.

## Backend e Segurança
- [YYYY-MM-DD] Backend: Obrigatoriedade de `use server` em Server Actions do Next.js.
- [YYYY-MM-DD] Backend: Todas as rotas de API devem ter middleware de autenticação explícito — nunca confiar em RLS como única camada.
- [YYYY-MM-DD] Security: Bloquear commits que contenham strings com padrão de API Keys (via pre-commit hook).

## Banco de Dados
- [YYYY-MM-DD] DB: Soft delete obrigatório (campo deleted_at) — nunca DELETE físico em tabelas de negócio.
- [YYYY-MM-DD] DB: Timestamps created_at e updated_at obrigatórios em todas as tabelas.
- [YYYY-MM-DD] DB: Migrations devem ser irreversíveis por padrão — operações destrutivas requerem aprovação manual.

## Qualidade e Processo
- [YYYY-MM-DD] Process: Após 3 rounds Coder/Evaluator sem convergência, registrar como "Paradoxo de Spec" e escalar para humano.
- [YYYY-MM-DD] Process: Progress.txt deve ser atualizado ao fim de CADA sessão — nunca deixar para depois.
- [YYYY-MM-DD] Cost: Custo máximo por sessão de Acceptance Reviewer (Opus): $5. Se ultrapassar, dividir auditoria em módulos.

## Performance
- [YYYY-MM-DD] Performance: Lighthouse score mínimo de 90 para deploy em produção.
- [YYYY-MM-DD] Performance: Bundle inicial deve ser < 500KB (gzip).

## Acessibilidade
- [YYYY-MM-DD] A11y: WCAG 2.1 AA obrigatório para todos os componentes UI.
- [YYYY-MM-DD] A11y: Navegação por teclado testada em todos os fluxos críticos.
```

---

## Como Atualizar os Arquivos

O **Orquestrador** deve adicionar entradas nesses arquivos quando:

1. **Um bug recorrente é encontrado** pelo Evaluator em mais de uma sprint
2. **O cliente expressa preferência** que deve ser mantida em futuros projetos
3. **Um incidente de segurança** é identificado pelo Security Auditor
4. **Um loop infinito** ocorre (3+ falhas sem convergência) — registrar a causa raiz
5. **Uma regra de negócio crítica** é descoberta tardiamente no pipeline

**Formato de adição:**
```
- [YYYY-MM-DD] [AGENTE]: [REGRA] — Origem: [incidente/preferência/auditoria]
```

A taxa de erro marginal tende a zero à medida que esses arquivos crescem.
