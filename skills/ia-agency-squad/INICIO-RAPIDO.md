# Início Rápido

## 1️⃣ O Que É Isso?

**AI Agency Squad** é um sistema de **18 agentes especializados** que desenvolvem software com IA.

## 2️⃣ Como Usar (Agora!)

### Opção A: Claude Code (Recomendado)

```bash
# 1. Abra o Claude Code
claude

# 2. Ative a skill
/ai-agency-squad

# 3. Responda as perguntas
# - Domínio do projeto
# - Stack preferida
# - Integrações
# - Restrições

# 4. Acompanhe a execução
```

### Opção B: Estudar a Documentação

```bash
# 1. Resumo rápido (2 min)
cat CLAUDE.md

# 2. Guia de uso (5 min)
cat COMO-USAR.md

# 3. Detalhes (10 min)
cat README.md

# 4. Governança (avançado)
cat harness.md
```

## 3️⃣ Estrutura

```
📁 ia-agency-squad/
├── 📘 ai-agency-squad.skill   ← Skill principal
├── 📄 pipeline.md             ← Pipeline overview
├── 📄 harness.md              ← Governança
├── 📄 CLAUDE.md               ← Resumo
├── 📄 README.md               ← Doc principal
├── 📄 COMO-USAR.md            ← Guia
├── 📄 IMPLEMENTACAO.md        ← Implementação
└── 📁 references/
    ├── pipeline-phase1.md     ← DB, Backend, Frontend, Integration
    ├── pipeline-phase2.md     ← Test, DevOps
    ├── pipeline-phase3.md     ← Performance, UX, Documentation
    ├── security.md            ← Security
    └── self-modifying-template.md
```

## 4️⃣ Agentes (18 total)

| Fase | Agentes | Função |
|------|---------|--------|
| **Base** | 9 agentes | Descoberta, produto, arquitetura |
| **Fase 1** | 4 agentes | DB, Backend, Frontend, Integration |
| **Fase 2** | 2 agentes | Test, DevOps |
| **Fase 3** | 3 agentes | Performance, UX, Documentation |

## 5️⃣ Pipeline

```
Discovery → PRD → Validator → Architect → Spec → Enricher → Planner
  ↓
DB → Backend → Frontend → Integration (Fase 1)
  ↓
Test → DevOps (Fase 2)
  ↓
Performance → UX → Documentation (Fase 3)
  ↓
Security Auditor → Acceptance Reviewer → DEPLOY ✓
```

## 6️⃣ Métricas

| Métrica | Alvo |
|---------|------|
| Test Coverage | ≥ 80% |
| Lighthouse | ≥ 90 |
| WCAG | 2.1 AA |
| Evaluator Score | ≥ 0.95 |

## 7️⃣ Quando Usar

| Fase | Quando |
|------|--------|
| **Base** | MVP, validação |
| **Fase 1** | Produtos com camadas |
| **Fase 2** | Enterprise |
| **Fase 3** | SaaS, e-commerce |

## 8️⃣ Links Rápidos

| Arquivo | Para quê? |
|---------|-----------|
| `CLAUDE.md` | Resumo executivo |
| `COMO-USAR.md` | Guia completo |
| `README.md` | Documentação principal |
| `IMPLEMENTACAO.md` │ O que foi implementado |
| `harness.md` | Governança |
| `references/security.md` | Segurança |

## 9️⃣ Exemplo Real

```bash
# 1. Ativar
/ai-agency-squad

# 2. Dizer o projeto
"Quero criar um SaaS de gestão de tarefas"

# 3. Stack
"Next.js, Node.js, Supabase"

# 4. Executar
# O pipeline roda automaticamente!
```

## 🆘 Problemas?

- **Skill não carrega:** Verifique se está no Claude Code
- **Erros:** Consulte `CLAUDE.md`
- **Dúvidas:** Consulte `COMO-USAR.md`

## ✅ Próximo Passo

```bash
# Ative a skill agora!
/ai-agency-squad
```
