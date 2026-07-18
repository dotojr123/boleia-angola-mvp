# Pipeline de Agentes — Visão Geral

Este arquivo contém a pipeline base (agentes 1-9, 18-19). Para os agentes especializados, consulte:

- **Fase 1 (DB, Backend, Frontend, Integration):** `references/pipeline-phase1.md`
- **Fase 2 (Test, DevOps):** `references/pipeline-phase2.md`
- **Fase 3 (Performance, UX, Documentation):** `references/pipeline-phase3.md`

---

## Agentes Base (1-9, 18-19)

| # | Agente | Modelo | Output |
|---|--------|--------|--------|
| 1 | Discovery Agent | Sonnet | `Discovery.md` |
| 2 | PRD Generator | Sonnet | `PRD.md` |
| 3 | PRD Validator | Flash | `PRD_validation.json` |
| 4 | Tech Architect | Sonnet | `stack.md` + `migrations.sql` |
| 5 | Spec Generator | Sonnet | `Spec.json` |
| 6 | Spec Enricher | Sonnet | `enricher_report.json` |
| 7 | Sprint Planner | Flash | `sprints.json` |
| 8 | Security Auditor | Sonnet | `security_report.md` |
| 9 | Acceptance Reviewer | Opus | `acceptance_review.md` |

## Fluxo Base

```
Discovery → PRD Generator → PRD Validator → Tech Architect → Spec Generator → Spec Enricher → Sprint Planner → [Fase 1] → [Fase 2] → [Fase 3] → Security Auditor → Acceptance Reviewer
```

---

## Próximos Passos

1. **Fase 1:** Implementação especializada (DB, Backend, Frontend, Integration)
   - Substitui o Coder Agent generalista por especialistas
   - Ver `references/pipeline-phase1.md`

2. **Fase 2:** Qualidade e Deploy (Test, DevOps)
   - Testes automatizados ≥ 80% coverage
   - CI/CD completo
   - Ver `references/pipeline-phase2.md`

3. **Fase 3:** Enterprise (Performance, UX, Documentation)
   - Otimização Lighthouse ≥ 90
   - WCAG 2.1 AA compliance
   - Documentação completa
   - Ver `references/pipeline-phase3.md`

---

## Sistema Completo (18 Agentes)

| Fase | Agentes | Total |
|------|---------|-------|
| Base | 1-9, 18-19 | 11 |
| Fase 1 | 10-13 | 4 |
| Fase 2 | 14-15 | 2 |
| Fase 3 | 16-18 | 3 |
| **Total** | | **18** |

---

## Governança

Consulte `harness.md` para:
- TOOL_PERMISSIONS por agente
- HARD_RESTRICTIONS
- 7 camadas de governança
- Human-in-the-loop triggers

---

## Segurança

Consulte `references/security.md` para:
- Pre-Deploy Security Checklist
- Critical items (C1-C6)
- Secret patterns
- RLS validation

---

## Self-Modifying Layer

Consulte `references/self-modifying-template.md` para:
- Template do `agents.md`
- Template do `cloud.md`
- Regras de atualização
