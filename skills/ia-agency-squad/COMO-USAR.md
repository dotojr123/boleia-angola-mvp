# Como Usar a AI Agency Squad

## Visão Geral

Este repositório contém um **squad de 18 agentes especializados** para desenvolvimento de software com IA.

## Estrutura Atual

```
ia-agency-squad/
├── ai-agency-squad.skill    ← Skill principal (18 agentes)
├── pipeline.md              ← Visão geral do pipeline
├── harness.md               ← Governança (7 camadas)
├── CLAUDE.md                ← Resumo rápido
├── README.md                ← Documentação principal
├── COMO-USAR.md             ← Este arquivo
└── references/
    ├── pipeline-phase1.md   ← DB, Backend, Frontend, Integration
    ├── pipeline-phase2.md   ← Test, DevOps
    ├── pipeline-phase3.md   ← Performance, UX, Documentation
    ├── security.md          ← Security checklist
    └── self-modifying-template.md
```

## Como Ativar a Skill

### Opção 1: Via Claude Code (Recomendado)

1. **Abra o Claude Code** no terminal ou VS Code
2. **Digite o comando:**
   ```
   /ai-agency-squad
   ```
3. **Responda as perguntas** do Orquestrador:
   - Domínio do projeto
   - Stack preferida
   - Integrações externas
   - Restrições de negócio

4. **Acompanhe a execução** - O pipeline executa automaticamente

### Opção 2: Manual (Avançado)

1. Leia `ai-agency-squad.skill` para entender a fluxo
2. Execute cada agente na ordem:
   ```
   Discovery → PRD → Validator → Architect → Spec → Enricher → Planner
   ↓
   DB → Backend → Frontend → Integration (Fase 1)
   ↓
   Test → DevOps (Fase 2)
   ↓
   Performance → UX → Documentation (Fase 3)
   ↓
   Security Auditor → Acceptance Reviewer
   ```

## Quando Usar Cada Fase

| Fase | Agentes | Quando Usar | Custo Relativo |
|------|---------|-------------|----------------|
| **Base** | 1-9, 18-19 | MVP, projetos pequenos, validação | $ |
| **Fase 1** | +10-13 | Produtos com camadas especializadas | $$ |
| **Fase 2** | +14-15 | Enterprise, CI/CD obrigatório | $$$ |
| **Fase 3** | +16-18 | SaaS, e-commerce, compliance | $$$$ |

## Exemplo de Uso

### Projeto: SaaS de Gestão de Tarefas

**Passo 1:** Ativar skill
```
/ai-agency-squad
```

**Passo 2:** Responder contexto
```
Domínio: SaaS de gestão de tarefas
Stack: Next.js, Node.js, Supabase, Supabase Auth
Integrações: Stripe (pagamento), SendGrid (email)
Restrições: 3 meses, equipe de 2 devs
```

**Passo 3:** Acompanhar execução
- Discovery Agent gera `Discovery.md`
- PRD Generator gera `PRD.md`
- Tech Architect define stack
- DB Agent otimiza migrations
- Backend Agent cria APIs
- Frontend Agent cria componentes
- Integration Agent valida integração
- Test Agent escreve testes (≥80% coverage)
- DevOps Agent configura CI/CD
- Security Auditor valida segurança
- Acceptance Reviewer aprova deploy

## Arquivos Gerados

Cada agente gera seu próprio arquivo de resumo:

| Agente | Arquivo de Saída |
|--------|------------------|
| Discovery | `Discovery.md` |
| PRD Generator | `PRD.md` |
| Tech Architect | `stack.md` + `migrations.sql` |
| Spec Generator | `Spec.json` |
| DB Agent | `db_summary.md` |
| Backend Agent | `backend_summary.md` |
| Frontend Agent | `frontend_summary.md` |
| Integration Agent | `integration_report.md` |
| Test Agent | `test_coverage.md` |
| DevOps Agent | `deploy_summary.md` |
| Security Auditor | `security_report.md` |
| Acceptance Reviewer | `acceptance_review.md` |

## Métricas de Qualidade

| Métrica | Alvo | Como Validar |
|---------|------|--------------|
| Test Coverage | ≥ 80% | `test_coverage.md` |
| Lighthouse Score | ≥ 90 | `performance_report.md` |
| WCAG Compliance | 2.1 AA | `ux_a11y_report.md` |
| Evaluator Score | ≥ 0.95 | `evaluator_feedback.json` |

## Governança

Consulte `harness.md` para:
- TOOL_PERMISSIONS por agente
- HARD_RESTRICTIONS (imutáveis)
- Human-in-the-loop triggers
- 7 camadas de governança

## Segurança

Consulte `references/security.md` para:
- Pre-Deploy Security Checklist
- Critical items (C1-C6)
- Secret patterns
- RLS validation

## Self-Modifying Layer

Após cada ciclo, atualize:
- `agents.md` - Regras aprendidas por agente
- `cloud.md` - Regras de arquitetura

Use o template em `references/self-modifying-template.md`.

## Solução de Problemas

### "Agente não responde"**
- Verifique se o contexto está limpo
- Confirme se o agente anterior gerou output

### "Coverage abaixo de 80%"**
- Test Agent deve escrever mais testes unitários
- Adicionar testes de erro (não só happy path)

### "Security Auditor bloqueou deploy"**
- Verifique `security_report.md`
- Itens C1-C6 são bloqueadores
- Corrija antes de tentar novamente

## Próximos Passos

1. **Comece com a Fase Base** para validar o conceito
2. **Adicione Fase 1** quando precisar de especialização
3. **Adicione Fase 2** para enterprise/CI-CD
4. **Adicione Fase 3** para SaaS/e-commerce

## Suporte

- **CLAUDE.md** - Resumo executivo
- **README.md** - Documentação completa
- **harness.md** - Governança
- **references/** - Templates e checklists
