# Pre-Deploy Security Checklist

Executado pelo **Security Auditor Agent** antes de qualquer deploy. Cada item é BINÁRIO: PASS ou FAIL. Items CRÍTICOS bloqueiam o pipeline.

---

## NÍVEL CRÍTICO — Bloqueadores de Deploy

| # | Item | Como Verificar | Remediação |
|---|------|----------------|------------|
| C1 | RLS ativo em todas as tabelas | `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` → verificar policies | Ativar RLS + criar policies por tabela |
| C2 | Zero API Keys hardcoded no código | `grep -r "sk-\|AKIA\|Bearer " --include="*.ts" --include="*.js" .` | Mover para .env; revogar chave exposta imediatamente |
| C3 | .gitignore configurado ANTES do primeiro commit | `git log --diff-filter=A -- .gitignore` | Revogar todos os secrets expostos no histórico |
| C4 | UUIDs em todas as PKs (sem INT sequencial) | Verificar migrations.sql e schema do banco | Alterar schema; nunca migrar em produção com dados |
| C5 | Queries parametrizadas (zero concatenação SQL) | `grep -r "query\s*+" --include="*.ts" .` | Substituir por Prisma/Drizzle parametrizado |
| C6 | Secrets de Service Role nunca expostos no frontend | Verificar arquivos com `NEXT_PUBLIC_` ou `VITE_` | Mover para backend only; rotacionar chave |

---

## NÍVEL ALTO — Devem ser corrigidos antes do deploy

| # | Item | Verificação |
|---|------|-------------|
| H1 | HTTPS obrigatório em todos os endpoints | Verificar configuração de redirect HTTP→HTTPS |
| H2 | Rate limiting nos endpoints de auth | Verificar middleware de rate limit em /auth/* |
| H3 | Tratamento de erro em TODAS as chamadas de API externa | `grep -r "catch\|try" --include="*.ts"` — verificar cobertura |
| H4 | Validação de input no servidor (não apenas no cliente) | Verificar schemas de validação (Zod, Yup) no backend |
| H5 | CORS configurado restritivamente (não `*`) | Verificar configuração de CORS origins |

---

## NÍVEL MÉDIO — Recomendados

| # | Item |
|---|------|
| M1 | Logs de auditoria para operações sensíveis (login, delete, pagamento) |
| M2 | Expiração de tokens JWT configurada (máx. 24h para access tokens) |
| M3 | Refresh token rotation implementado |
| M4 | CSP (Content Security Policy) headers configurados |
| M5 | Dependências verificadas com `npm audit` (zero vulnerabilidades críticas) |

---

## OUTPUT OBRIGATÓRIO — security_report.md

```markdown
# Security Audit Report
**Projeto:** [nome]
**Data:** [data]
**Auditor:** Security Auditor Agent
**Resultado Geral:** [APROVADO / REPROVADO / APROVADO COM RESSALVAS]

## Itens Críticos
| Item | Status | Evidência |
|------|--------|-----------|
| C1 - RLS | ✅ PASS | Policies ativas em users, projects, tasks |
| C2 - API Keys | ✅ PASS | Nenhuma chave encontrada no código |
| C5 - SQL Injection | ✅ PASS | Prisma parametrizado em 100% das queries |

## Itens Altos
...

## Plano de Remediação (se REPROVADO)
...

## Decisão
[DEPLOY LIBERADO / DEPLOY BLOQUEADO PENDING REMEDIAÇÃO]
```

---

## REGRAS DE SECRETS (Guia Rápido)

```bash
# ✅ CORRETO — Backend only (nunca exposto ao browser)
SUPABASE_SERVICE_ROLE_KEY=xxx # server-side apenas
DATABASE_URL=xxx # server-side apenas
STRIPE_SECRET_KEY=xxx # server-side apenas

# ⚠️ ATENÇÃO — Exposto ao browser via F12 Tools
NEXT_PUBLIC_SUPABASE_URL=xxx # OK apenas para URL pública
VITE_SUPABASE_ANON_KEY=xxx # OK apenas para anon key (com RLS ativo!)

# 🚫 NUNCA FAZER
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx # CRÍTICO: expõe admin do banco
VITE_STRIPE_SECRET_KEY=xxx # CRÍTICO: expõe acesso total ao Stripe
```
