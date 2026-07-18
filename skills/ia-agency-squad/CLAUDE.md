# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI Agency Squad Enterprise** system that orchestrates a hierarchical team of **18 AI agents** to build software products using Spec-Driven Development (SDD) methodology with specialized agents per layer.

## Core Architecture

### 18-Agent Pipeline (4 Fases)

**Base Agents (1-8, 18-19):**
| # | Agent | Model | Output |
|---|-------|-------|--------|
| 1 | Discovery Agent | Sonnet | `Discovery.md` |
| 2 | PRD Generator | Sonnet | `PRD.md` (800+ lines) |
| 3 | PRD Validator | Flash | `PRD_validation.json` |
| 4 | Tech Architect | Sonnet | `stack.md` + `migrations.sql` |
| 5 | Spec Generator | Sonnet | `Spec.json` |
| 6 | Spec Enricher | Sonnet | `enricher_report.json` |
| 7 | Sprint Planner | Flash | `sprints.json` |
| 8 | Security Auditor | Sonnet | `security_report.md` |
| 9 | Acceptance Reviewer | Opus | `acceptance_review.md` |

**Fase 1 - Implementação Especializada:**
| # | Agent | Model | Output |
|---|-------|-------|--------|
| 10 | DB Agent | Sonnet | `migrations.sql` (otimizado) + `db_summary.md` |
| 11 | Backend Agent | Sonnet | APIs + `backend_summary.md` |
| 12 | Frontend Agent | Sonnet | UI + `frontend_summary.md` |
| 13 | Integration Agent | Sonnet | `integration_report.md` + health checks |

**Fase 2 - Qualidade:**
| # | Agent | Model | Output |
|---|-------|-------|--------|
| 14 | Test Agent | Sonnet | Testes + `test_coverage.md` (≥80%) |
| 15 | DevOps Agent | Sonnet | CI/CD + `deploy_summary.md` |

**Fase 3 - Enterprise:**
| # | Agent | Model | Output |
|---|-------|-------|--------|
| 16 | Performance Agent | Sonnet | `performance_report.md` (Lighthouse ≥90) |
| 17 | UX/Accessibility Agent | Opus | `ux_a11y_report.md` (WCAG 2.1 AA) |
| 18 | Documentation Agent | Flash | README + API docs + ADRs |

### Harness Governance (7 Layers)

1. **Lifecycle Management**: Clean context spawns only; no session reuse between features
2. **Tool Orchestration**: Strict read/write permissions per agent type (see `harness-updated.md`)
3. **Memory Management**: Iceberg strategy (load fragments); compact at 60%; clear after 3 compactions
4. **Guardrails**: Blocks destructive actions (DROP TABLE, git push --force, production deploy)
5. **Squad Delegation**: Isolated sprints with structured JSON feedback loops
6. **Human-in-the-Loop**: Required for 3 consecutive failures, critical security issues, production deploys, coverage <80%
7. **Observability**: Track cost_per_agent, rounds_to_success, context_saturation, evaluator_score, test_coverage, lighthouse_score

## Key Files

| File | Purpose |
|------|---------|
| `ai-agency-squad-updated.skill` | Main skill definition with 18-agent topology |
| `pipeline.md` | System prompts for base agents (1-9, 18-19) |
| `pipeline-phase1.md` | DB Agent, Backend Agent, Frontend Agent, Integration Agent |
| `pipeline-phase2.md` | Test Agent, DevOps Agent |
| `pipeline-phase3.md` | Performance Agent, UX/Accessibility Agent, Documentation Agent |
| `harness-updated.md` | 7-layer governance architecture with TOOL_PERMISSIONS and HARD_RESTRICTIONS |
| `security.md` | Pre-deploy security checklist (C1-C6 critical items block deploy) |
| `self-modifying-template.md` | Template for `agents.md` / `cloud.md` learnings |

## Critical Rules

- **JSON > Markdown** for specs (resilient to corruption)
- **UUIDs only** for primary keys (no sequential IDs)
- **RLS mandatory** on all Supabase tables
- **Zero hardcoded secrets** (grep patterns: `sk-`, `AKIA`, `Bearer`)
- **3-strike rule**: Max 3 Coder/Evaluator rounds before human escalation
- **Clean context for validators**: PRD Validator, Spec Enricher, Evaluator, Test Agent never see creation history
- **Test coverage ≥80%**: Blocks merge if below threshold
- **Specialization respected**: Backend doesn't access DB directly, Frontend doesn't modify backend

## Security Gates (Pre-Deploy)

Critical items (block deploy if failed):
- C1: RLS active on all tables
- C2: Zero API keys in code
- C3: `.gitignore` before first commit
- C4: UUIDs on all PKs
- C5: Parameterized queries only
- C6: Service role keys never exposed to frontend

## Cost Model Target

- 60% Flash (triage, documentation, simple tests)
- 30% Sonnet (technical reasoning, implementation)
- 10% Opus (orchestrator, acceptance reviewer, UX/Accessibility)

## Agent Specialization Rules

**DB Agent:**
- MUST use UUIDs (no sequential IDs)
- MUST include RLS policies
- MUST have rollback for migrations
- MUST implement soft delete (deleted_at)

**Backend Agent:**
- NO direct DB access (uses DB Agent)
- MUST use parameterized queries
- MUST include authentication on protected routes
- MUST include rate limiting on sensitive endpoints

**Frontend Agent:**
- NO database access
- NO backend modification
- MUST include accessibility (WCAG 2.1 AA)
- MUST use skeleton screens over spinners

**Integration Agent:**
- NO hardcoded endpoints
- MUST include retry logic with exponential backoff
- MUST include circuit breaker for external APIs
- MUST validate environment variables

**Test Agent:**
- MUST achieve ≥80% coverage
- MUST mock external APIs
- MUST include error cases (not just happy path)
- NO test-dependent tests (independent execution)

**DevOps Agent:**
- NO production deploy without human approval
- MUST include rollback procedure
- MUST include health checks
- NO secrets in code

**Performance Agent:**
- MUST measure before optimizing
- MUST include benchmarks
- Lighthouse score ≥90 target

**UX/Accessibility Agent:**
- WCAG 2.1 AA mandatory
- MUST test with screen readers (NVDA, VoiceOver)
- MUST test keyboard navigation

**Documentation Agent:**
- MUST include examples
- MUST link to source code
- README must have 5-minute quickstart

## Pipeline Flow (Complete)

```
Discovery → PRD Generator → PRD Validator → Tech Architect → Spec Generator → Spec Enricher → Sprint Planner
    ↓
    v
[FASE 1]
DB Agent → Backend Agent → Frontend Agent → Integration Agent
    ↓
    v
[FASE 2]
Test Agent → DevOps Agent
    ↓
    v
[FASE 3 - Opcional]
Performance Agent → UX/Accessibility Agent → Documentation Agent
    ↓
    v
Security Auditor → Acceptance Reviewer → DEPLOY ✓
```
