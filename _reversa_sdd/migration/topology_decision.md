# Decisão de Topologia — Boleia Angola

**Gerado em:** 2026-07-16  
**Agente:** Designer  
**Fase:** Fase 1 — Decisão de Topologia

---

## Topologia do Legado Detectada

**Padrão:** Package-by-role (frontend) + Module-by-route (backend)  
**Confiança:** 🟢 CONFIRMADO

**Evidências:**
- Frontend organizado por roles: `pages/admin/`, `pages/driver/`, `pages/passenger/`, `pages/auth/`
- Backend organizado por módulos de rota: `server/src/routes/{auth,rides,bookings,...}.js`
- Componentes reutilizáveis centralizados em `components/`
- 12 módulos backend com responsabilidade única

**Árvore legada:**
```
boleia-angola/
├── src/ (frontend)
│   ├── pages/{admin,driver,passenger,auth,profile,public}/  ← package-by-role
│   ├── components/    ← shared UI
│   ├── contexts/      ← global state
│   └── models/        ← tipos
└── server/src/routes/ ← package-by-feature
```

---

## Diagnóstico de Saúde Estrutural

**Avaliação:** Parcialmente problemática

**Pontos fortes:**
- ✅ Separação clara frontend/backend
- ✅ Componentes reutilizáveis bem centralizados
- ✅ Módulos backend com responsabilidade única

**Problemas:**
- 🔴 Acoplamento por role no frontend (lógica específica misturada com compartilhada)
- 🔴 Duplicação de código (validação de telefone em auth.js e driver.js)
- 🔴 Falta de bounded contexts explícitos
- 🔴 Organização inconsistente de componentes
- 🟡 Baixa cobertura de testes (~8%)

---

## Topologia Moderna Proposta

**Padrão:** Feature-Sliced Design (FSD) com Bounded Contexts explícitos

**Justificativa:**
- Alinha com domínios claros do sistema (auth, rides, bookings, profiles)
- Facilita evolução incremental (strangler fig pattern)
- Melhora testabilidade e onboarding
- Compatível com React + Express
- Padrão emergente em projetos React modernos

**Árvore proposta:**
```
boleia-angola/
├── features/           # Bounded contexts (vertical slices)
│   ├── auth/
│   │   ├── ui/        # Componentes UI
│   │   ├── api/       # Chamadas API
│   │   ├── model/     # Tipos, validação, regras
│   │   └── lib/       # Hooks, utilitários
│   ├── rides/
│   ├── bookings/
│   ├── profiles/
│   ├── vehicles/
│   └── admin/
├── entities/          # Entidades de domínio compartilhadas
│   ├── user/
│   ├── ride/
│   ├── booking/
│   └── vehicle/
├── shared/            # Clusters utilitários
│   ├── ui/            # Botão, Input, Modal
│   ├── lib/           # API client, forms
│   └── config/        # Constantes, env
└── server/
    └── features/      # Backend feature-aligned
```

**Ganhos esperados:**
- ✅ Isolamento de domínios
- ✅ Melhor testabilidade
- ✅ Onboarding mais rápido
- ✅ Facilita migração para micro-frontends

---

## Opções Apresentadas

1. **Preservar topologia legada** (conservador)
2. **Adotar Feature-Sliced Design** (transformacional) ← **ESCOLHIDA**
3. **Híbrido** (equilibrado)

---

## Decisão do Usuário

**Opção escolhida:** **2 — Adotar Feature-Sliced Design**

**Data da decisão:** 2026-07-16  
**Motivação:** O sistema já tem domínios claros, tornando FSD natural. Investimento inicial permite evolução mais segura no futuro e alinha com vertical slices que facilita TDD e subagentes independentes.

---

## Mapeamento Legado → Novo

| Legado (frontend) | Novo (FSD) | Tipo |
|-------------------|------------|------|
| `src/pages/auth/` | `features/auth/ui/` + `features/auth/model/` | 1-para-1 |
| `src/pages/driver/` | `features/rides/` + `features/vehicles/` | Dividido |
| `src/pages/passenger/` | `features/bookings/` + `features/rides/` | Dividido |
| `src/pages/admin/` | `features/admin/` | 1-para-1 |
| `src/components/` | `shared/ui/` + `entities/*/ui/` | Reorganizado |
| `src/models/` | `entities/*/model/` | Reorganizado |
| `server/src/routes/auth.js` | `server/features/auth/` | 1-para-1 |
| `server/src/routes/rides.js` | `server/features/rides/` | 1-para-1 |

---

## Implicações para Próximos Etapas

1. **Arquitetura Alvo** deve refletir a estrutura FSD proposta
2. **Bounded Contexts** serão: auth, rides, bookings, profiles, vehicles, admin
3. **Dominío Model** deve seguir vertical slices por feature
4. **Data Model** pode permanecer relacional, mas com agrupamento por bounded context
5. **Migração de código** será progressiva (strangler fig)

---

## Rastreabilidade

- **Topologia detectada extraída de:** `_reversa_sdd/inventory.md`, `_reversa_sdd/architecture.md`
- **Diagnóstico extraído de:** `_reversa_sdd/code-analysis-full.md`
- **Decisão registrada:** 2026-07-16TXX:XX:XXZ

**Status:** ✅ Aprovado pelo usuário  
**Próximo agente:** Designer (Fase 2 — Arquitetura, Domínio e Dados)