# Agent Harness — Arquitetura de 7 Camadas (Versão Enterprise)

O Harness é a camada de código externo que governa todos os agentes.
**Enquanto o modelo "pensa", o Harness governa.**

---

## CAMADA 1 — Ciclo de Vida (Lifecycle Management)

Responsável por nascer e matar instâncias de agentes.

```javascript
class AgentLifecycle {
  async spawnAgent(agentId, config, contextPayload) {
    // SEMPRE contexto limpo — nunca herdar sessão anterior
    const session = await claude.createSession({
      model: config.model,
      system_prompt: AGENT_PROMPTS[agentId],
      context: contextPayload, // apenas o artefato necessário
      timeout_ms: config.timeout ?? 300_000
    });

    this.activeSessions.set(agentId, session);
    await this.progressLog.record(`Agent ${agentId} spawned.`);
    return session;
  }

  async killAgent(agentId) {
    const session = this.activeSessions.get(agentId);
    if (session) {
      await session.terminate();
      this.activeSessions.delete(agentId);
      await this.progressLog.record(`Agent ${agentId} terminated.`);
    }
  }

  // Spawn com contexto limpo para nova feature
  async cleanSpawn(agentId, config, freshContext) {
    await this.killAgent(agentId); // mata a sessão antiga
    return this.spawnAgent(agentId, config, freshContext);
  }
}
```

**Regra:** Nunca reutilize sessões entre features diferentes. "Alucinações de contexto" são mais perigosas que o custo de uma nova sessão.

---

## CAMADA 2 — Orquestração de Ferramentas

Define o que cada agente PODE e NÃO PODE fazer.

```javascript
const TOOL_PERMISSIONS = {
  // === ESTÁGIO PRODUTO ===
  orchestrator: ["all"],
  discovery: ["read_files", "write_discovery_md"],
  prd_generator: ["read_discovery", "write_prd"],
  prd_validator: ["read_prd_only"],
  
  // === ESTÁGIO ARQUITETURA ===
  tech_architect: ["read_prd", "write_stack", "write_migrations"],
  db_agent: ["read_migrations", "write_migrations", "read_db_schema", "run_db_validations"],
  
  // === ESTÁGIO ESPECIFICAÇÃO ===
  spec_generator: ["read_prd", "read_stack", "write_spec_json"],
  spec_enricher: ["read_spec_json_only"],
  sprint_planner: ["read_spec_json", "write_sprints_json"],
  
  // === FASE 1 - IMPLEMENTAÇÃO ===
  backend_agent: [
    "read_sprint_only",
    "write_backend_code",
    "write_api",
    "read_db_schema"
  ],
  frontend_agent: [
    "read_sprint_only",
    "write_frontend_code",
    "read_api_spec",
    "read_backend_summary"
  ],
  integration_agent: [
    "read_all_code",
    "read_env_schema",
    "write_health_checks",
    "read_backend_summary",
    "read_frontend_summary"
  ],
  
  // === FASE 2 - QUALIDADE ===
  test_agent: [
    "read_all_code",
    "write_tests",
    "run_tests",
    "read_test_coverage"
  ],
  devops_agent: [
    "read_all_code",
    "write_config",
    "write_ci_cd",
    "deploy_staging",
    "read_test_coverage"
  ],
  
  // === FASE 3 - ENTERPRISE ===
  performance_agent: [
    "read_all_code",
    "run_benchmarks",
    "write_optimization",
    "read_lighthouse_metrics"
  ],
  ux_accessibility_agent: [
    "read_frontend_code",
    "run_a11y_audit",
    "write_ux_report",
    "run_screen_reader_tests"
  ],
  documentation_agent: [
    "read_all_code",
    "write_docs",
    "read_adr_index"
  ],
  
  // === QA FINAL ===
  evaluator: ["read_code", "read_tests", "read_acceptance_criteria"],
  security_auditor: ["read_all_code", "glob", "grep"],
  acceptance_reviewer: ["read_all"]
};
```

### HARD RESTRICTIONS (Imutáveis)

```javascript
const HARD_RESTRICTIONS = {
  // Backend Agent
  backend_agent: [
    "NO_DB_DIRECT_ACCESS", // deve usar DB Agent
    "NO_DEPLOY",
    "NO_ENV_WRITE",
    "NO_HARDCODED_SECRETS",
    "MUST_USE_PARAMETERIZED_QUERIES"
  ],
  
  // Frontend Agent
  frontend_agent: [
    "NO_DATABASE_ACCESS",
    "NO_BACKEND_MODIFY",
    "NO_SERVER_SIDE_KEYS",
    "MUST_INCLUDE_A11Y",
    "NO_HARDCODED_SECRETS"
  ],
  
  // DB Agent
  db_agent: [
    "NO_DROP_COLUMN_WITHOUT_SOFT_DELETE",
    "NO_MIGRATION_WITHOUT_ROLLBACK",
    "MUST_USE_UUIDS",
    "MUST_INCLUDE_RLS",
    "NO_SEQUENTIAL_IDS"
  ],
  
  // Integration Agent
  integration_agent: [
    "NO_HARDCODED_ENDPOINTS",
    "MUST_INCLUDE_RETRY_LOGIC",
    "MUST_INCLUDE_CIRCUIT_BREAKER",
    "MUST_VALIDATE_ENV"
  ],
  
  // Test Agent
  test_agent: [
    "MUST_COVER_80_PERCENT",
    "MOCK_EXTERNAL_APIS",
    "NO_TEST_DEPENDENT_TESTS",
    "MUST_INCLUDE_ERROR_CASES"
  ],
  
  // DevOps Agent
  devops_agent: [
    "NO_PRODUCTION_DEPLOY_WITHOUT_HUMAN",
    "MUST_INCLUDE_ROLLBACK",
    "MUST_INCLUDE_HEALTH_CHECKS",
    "NO_SECRETS_IN_CODE"
  ],
  
  // Performance Agent
  performance_agent: [
    "MUST_MEASURE_BEFORE_OPTIMIZE",
    "MUST_INCLUDE_BENCHMARKS",
    "NO_OPTIMIZE_WITHOUT_TESTS"
  ],
  
  // UX/Accessibility Agent
  ux_accessibility_agent: [
    "WCAG_2_1_AA_MANDATORY",
    "MUST_TEST_SCREEN_READERS",
    "MUST_TEST_KEYBOARD_NAV"
  ],
  
  // Documentation Agent
  documentation_agent: [
    "MUST_INCLUDE_EXAMPLES",
    "MUST_LINK_TO_SOURCE",
    "NO_TODO_IN_DOCS"
  ],
  
  // Coder Agent (legado - para compatibilidade)
  coder: [
    "NO_DB_DIRECT_ACCESS",
    "NO_DEPLOY",
    "NO_ENV_WRITE",
    "MUST_USE_UUIDS",
    "MUST_USE_PARAMETERIZED_QUERIES"
  ],
  
  // Evaluator
  evaluator: [
    "NO_CODE_MODIFICATION",
    "MUST_USE_BINARY_CRITERIA"
  ],
  
  // Security Auditor
  security_auditor: [
    "NO_WRITE_ACCESS",
    "NO_DEPLOY"
  ],
  
  // Acceptance Reviewer
  acceptance_reviewer: [
    "NO_WRITE_ACCESS"
  ],
  
  // Regras gerais para todos agentes
  any_agent: [
    "NO_DROP_TABLE",
    "NO_HARDCODED_SECRETS",
    "NO_SEQUENTIAL_IDS",
    "NO_PRODUCTION_DEPLOY_WITHOUT_HUMAN"
  ]
};
```

---

## CAMADA 3 — Gestão de Memória

Estratégia de curto e longo prazo para manter janelas de contexto enxutas.

```javascript
class MemoryManager {
  // Memória de CURTO PRAZO — dentro da sessão
  async compactContext(session, threshold = 0.60) {
    const usage = await session.getContextUsage();
    if (usage.percentage >= threshold) {
      await session.compact(); // /compact
      await this.progressLog.record(`Context compacted at ${usage.percentage * 100}%`);
    }
  }

  // Memória de LONGO PRAZO — entre sessões (persistência externa)
  async saveToProgress(event) {
    const entry = `${new Date().toISOString()}: ${event}`;
    await fs.appendFile("progress.txt", entry + "\n");
  }

  // Estratégia Iceberg — carrega apenas o fragmento necessário
  async loadFragment(filePath, selector) {
    // Usa grep/glob para extrair apenas a seção relevante
    // Em vez de carregar um arquivo de 800 linhas, carrega apenas as linhas 120-145
    return await tools.grep(filePath, selector);
  }

  // Regra de higiene
  async enforceHygiene(session, compactionCount) {
    if (compactionCount >= 3) {
      await this.progressLog.record("Context hygiene: clearing after 3 compactions.");
      await session.clear(); // /clear
    }
  }
}
```

---

## CAMADA 4 — Guardrails e Regras de Segurança

```javascript
class GuardrailEngine {
  DESTRUCTIVE_ACTIONS = [
    "DROP TABLE", "DELETE FROM", "TRUNCATE",
    "rm -rf", "git push --force",
    "deploy to production"
  ];

  SECRET_PATTERNS = [
    /sk-[a-zA-Z0-9]{48}/, // OpenAI keys
    /AKIA[0-9A-Z]{16}/, // AWS keys
    /Bearer [a-zA-Z0-9\-._~+/]+=*/, // JWT tokens
    /ghp_[a-zA-Z0-9]{36}/, // GitHub PAT
    /xox[baprs]-[0-9a-zA-Z-]+/ // Slack tokens
  ];

  async validateAction(agent, action) {
    // Bloqueia ações destrutivas
    if (this.DESTRUCTIVE_ACTIONS.some(d => action.includes(d))) {
      await this.triggerHumanApproval(agent, action);
      return false;
    }

    // Bloqueia secrets em código
    if (this.SECRET_PATTERNS.some(p => p.test(action))) {
      throw new Error(`SECURITY VIOLATION: Secret detected in ${agent} output. Blocking commit.`);
    }

    return true;
  }

  async triggerHumanApproval(agent, action) {
    // Human-in-the-Loop para ações de alto impacto
    console.log(`⚠️ HUMAN APPROVAL REQUIRED`);
    console.log(`Agent: ${agent}`);
    console.log(`Action: ${action}`);
    // Pausa execução até aprovação explícita
  }
}
```

---

## CAMADA 5 — Delegação de Subagentes (Squad Governance)

```javascript
class SquadOrchestrator {
  async delegateSprint(sprintData) {
    // === FASE 1: DB Agent ===
    const dbSession = await lifecycle.cleanSpawn("db_agent",
      { model: "sonnet" },
      { sprint: sprintData, migrations: sprintData.migrations }
    );
    const dbResult = await dbSession.execute();
    
    // === FASE 1: Backend Agent ===
    const backendSession = await lifecycle.cleanSpawn("backend_agent",
      { model: "sonnet" },
      { sprint: sprintData, db_schema: dbResult.schema }
    );
    const backendResult = await backendSession.execute();
    
    // === FASE 1: Frontend Agent ===
    const frontendSession = await lifecycle.cleanSpawn("frontend_agent",
      { model: "sonnet" },
      { sprint: sprintData, api_spec: backendResult.api_spec }
    );
    const frontendResult = await frontendSession.execute();
    
    // === FASE 1: Integration Agent ===
    const integrationSession = await lifecycle.cleanSpawn("integration_agent",
      { model: "sonnet" },
      { backend: backendResult, frontend: frontendResult }
    );
    const integrationResult = await integrationSession.execute();
    
    // === FASE 2: Test Agent ===
    const testSession = await lifecycle.cleanSpawn("test_agent",
      { model: "sonnet" },
      { code: integrationResult, acceptance_criteria: sprintData.acceptance_criteria }
    );
    const testResult = await testSession.execute();
    
    if (testResult.coverage < 0.80) {
      await this.escalateToHuman(sprintData, "Test coverage below 80%");
      return { success: false, requires_human: true };
    }
    
    // === FASE 2: DevOps Agent ===
    const devopsSession = await lifecycle.cleanSpawn("devops_agent",
      { model: "sonnet" },
      { code: testResult, config: sprintData.deploy_config }
    );
    const devopsResult = await devopsSession.execute();
    
    // === FASE 3 (opcional): Performance Agent ===
    if (sprintData.require_enterprise) {
      const perfSession = await lifecycle.cleanSpawn("performance_agent",
        { model: "sonnet" },
        { code: devopsResult, metrics_target: sprintData.performance_targets }
      );
      await perfSession.execute();
      
      // === FASE 3: UX/Accessibility Agent ===
      const uxSession = await lifecycle.cleanSpawn("ux_accessibility_agent",
        { model: "opus" },
        { frontend: frontendResult }
      );
      await uxSession.execute();
      
      // === FASE 3: Documentation Agent ===
      const docSession = await lifecycle.cleanSpawn("documentation_agent",
        { model: "flash" },
        { code: devopsResult, decisions: sprintData.adrs }
      );
      await docSession.execute();
    }
    
    // === Evaluator ===
    const evalSession = await lifecycle.cleanSpawn("evaluator",
      { model: "sonnet" },
      { code: devopsResult, acceptance_criteria: sprintData.acceptance_criteria }
    );
    const feedback = await evalSession.evaluate();
    
    if (feedback.passed) {
      await memory.saveToProgress(`Sprint ${sprintData.id} PASSED. Score: ${feedback.overall_score}`);
      return { success: true, feedback };
    }
    
    // Retry logic (max 3 rounds)
    // ...
    
    await this.escalateToHuman(sprintData, "3 consecutive evaluation failures");
    return { success: false, requires_human: true };
  }
}
```

---

## CAMADA 6 — Human-in-the-Loop (HumanOps)

**Momentos de aprovação humana obrigatória:**

| Trigger | Agente | Ação |
|---------|--------|------|
| 3 falhas consecutivas no Coder/Evaluator | Qualquer | Pausa + notificação |
| PRD Validator retorna `validation_passed: false` | PRD Validator | Revisão humana do PRD |
| Loop Spec não converge em 3 rounds | Spec Generator | Paradoxo lógico identificado |
| Security Auditor reprovado em item CRÍTICO | Security Auditor | Bloqueio total do pipeline |
| Deploy em produção | Acceptance Reviewer | Aprovação manual explícita |
| DROP TABLE / DELETE em massa | Guardrail Engine | Aprovação manual explícita |
| Test coverage < 80% | Test Agent | Bloqueia merge |
| Performance abaixo do alvo | Performance Agent | Otimização obrigatória |
| WCAG AA não atingido | UX/Accessibility Agent | Correção obrigatória |

---

## CAMADA 7 — Observabilidade e Métricas

```javascript
class HarnessObservability {
  // Métricas coletadas automaticamente
  async recordAgentRun(agentId, result) {
    const metric = {
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      tokens_used: result.usage.total_tokens,
      cost_usd: this.calculateCost(result.usage, agentId),
      duration_ms: result.duration,
      rounds_to_success: result.rounds,
      status: result.passed ? "SUCCESS" : "FAILURE"
    };

    await this.metricsStore.append(metric);
    await this.checkAlerts(metric);
  }

  async checkAlerts(metric) {
    // Alerta se custo por agente ultrapassar limites
    if (metric.cost_usd > COST_LIMITS[metric.agent_id]) {
      await this.notify(`⚠️ Cost alert: ${metric.agent_id} spent $${metric.cost_usd}`);
    }

    // Alerta de contexto saturado
    if (metric.context_percentage > 0.80) {
      await this.notify(`⚠️ Context saturation: ${metric.agent_id} at ${metric.context_percentage * 100}%`);
    }
    
    // Alerta de cobertura de testes
    if (metric.agent_id === "test_agent" && metric.coverage < 0.80) {
      await this.notify(`⚠️ Test coverage alert: ${metric.agent_id} at ${metric.coverage * 100}%`);
    }
    
    // Alerta de performance
    if (metric.agent_id === "performance_agent" && metric.lighthouse_score < 90) {
      await this.notify(`⚠️ Performance alert: Lighthouse score ${metric.lighthouse_score}`);
    }
  }
}
```

**Dashboards recomendados:**
- **Grafana:** Tempo de entrega por sprint, consumo de tokens por agente, custo acumulado
- **Sentry:** Exceções em runtime, erros de API, falhas de integração
- **Lighthouse CI:** Performance trends, accessibility score

---

## SELF-MODIFYING LAYER

Após cada ciclo completo, o Orquestrador DEVE atualizar o `agents.md`:

```markdown
# Regras de Arquitetura Aprendidas (Self-Modifying Layer)

- [DATA] Coder: Sempre inicializar RLS antes de qualquer operação de escrita no Supabase.
- [DATA] Spec Enricher: Verificar consistência de enums entre Spec e PRD como checklist item 1.
- [DATA] Security: VITE_ prefix em variável de API key detectado — bloqueio adicionado ao Guardrail.
- [DATA] Evaluator: Score mínimo elevado de 0.90 para 0.95 após incidente de bug em produção.
- [DATA] DB Agent: Sempre adicionar índice em foreign keys antes de migrar dados.
- [DATA] Backend Agent: Incluir rate limiting em todos endpoints de auth.
- [DATA] Frontend Agent: Skeleton screens preferidos sobre spinners.
- [DATA] Test Agent: Mock todas APIs externas para evitar flaky tests.
- [DATA] DevOps Agent: Health check obrigatório antes de tráfego em produção.
- [DATA] Performance Agent: Imagens devem ter < 200KB após otimização.
- [DATA] UX Agent: Testar com NVDA e VoiceOver antes de merge.
- [DATA] Documentation Agent: README deve ter quick start de 5 minutos.
```

---

## MATRIZ DE ESPECIALIZAÇÃO POR FASE

| Fase | Agentes | Quando Usar |
|------|---------|-------------|
| **Base** | Discovery, PRD, Tech Architect, Spec, Coder, Evaluator, Security, Acceptance | MVP, projetos pequenos |
| **Fase 1** | + DB Agent, Backend Agent, Frontend Agent, Integration Agent | Produtos que demandam qualidade em camadas |
| **Fase 2** | + Test Agent, DevOps Agent | Enterprise, CI/CD obrigatório |
| **Fase 3** | + Performance Agent, UX/Accessibility Agent, Documentation Agent | SaaS, e-commerce, compliance |

**Custo por Sprint (estimativa):**
- Base: $15-30
- Fase 1: $30-50
- Fase 2: $50-80
- Fase 3: $80-150
