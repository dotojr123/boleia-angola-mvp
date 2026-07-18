# AI Agency Squad Enterprise

Sistema completo de **18 agentes especializados** para desenvolvimento de software com IA, seguindo a metodologia **Spec-Driven Development (SDD)**.

## Como Usar

### Opção 1: Via Claude Code (Recomendado)

1. **Ativar a skill** - Digite `/ai-agency-squad` no Claude Code
2. **Responder perguntas** - O Orquestrador vai coletar contexto do projeto
3. **Acompanhar execução** - O pipeline executa automaticamente

### Opção 2: Manual

1. Ler `ai-agency-squad.skill` para entender a topologia
2. Executar agentes conforme `pipeline.md` e fases
3. Consultar `harness.md` para governança

## Estrutura de Arquivos

```
ia-agency-squad/
├── ai-agency-squad.skill    ← Skill definition (18 agentes)
├── pipeline.md              ← Agentes base (1-9, 18-19)
├── pipeline-phase1.md       ← DB, Backend, Frontend, Integration
├── pipeline-phase2.md       ← Test, DevOps
├── pipeline-phase3.md       ← Performance, UX, Documentation
├── harness.md               ← Governança (7 camadas)
├── CLAUDE.md                ← Resumo para Claude Code
├── README.md                ← Este arquivo
├── README-UPDATES.md        ← Histórico de mudanças
└── references/
    ├── security.md          ← Security checklist
    └── self-modifying-template.md
```

## Agentes por Fase

| Fase | Agentes | Quando Usar |
|------|---------|-------------|
| **Base** | 1-9, 18-19 | MVP, projetos pequenos |
| **Fase 1** | +10-13 | Produtos com camadas especializadas |
| **Fase 2** | +14-15 | Enterprise, CI/CD obrigatório |
| **Fase 3** | +16-18 | SaaS, e-commerce, compliance |

## Pipeline Completo (18 agentes)

```
Discovery → PRD → Validator → Architect → Spec → Enricher → Planner
  ↓
DB Agent → Backend → Frontend → Integration (Fase 1)
  ↓
Test → DevOps (Fase 2)
  ↓
Performance → UX → Documentation (Fase 3)
  ↓
Security Auditor → Acceptance Reviewer → DEPLOY
```

## Métricas Alvo

- **Test Coverage:** ≥ 80%
- **Lighthouse Score:** ≥ 90
- **WCAG Compliance:** 2.1 AA
- **Evaluator Score:** ≥ 0.95

## Documentação

- **CLAUDE.md** - Resumo rápido da arquitetura
- **ai-agency-squad.skill** - Skill completa com prompts
- **harness.md** - Governança e permissões
- **README-UPDATES.md** - Histórico detalhado das mudanças

## Início Rápido

```bash
# 1. Navegue até a pasta
cd ia-agency-squad

# 2. Abra no Claude Code
claude

# 3. Ative a skill
/ai-agency-squad

# 4. Siga as instruções do Orquestrador
```

## Suporte

Para dúvidas sobre a implementação, consulte:
- `README-UPDATES.md` - Explicação detalhada de cada agente
- `harness.md` - Regras de governança
- `CLAUDE.md` - Resumo executivo
