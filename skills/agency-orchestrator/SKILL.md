---
name: agency-orchestrator
description: "Orquestrador-chefe da agência, responsável por entender o projeto, selecionar categorias de skills e montar o time/agentes certos para cada demanda."
---

# Agency Orchestrator 🧠

Este é o "Cérebro-Chefe" da IDE. Toda tarefa complexa ou novo projeto deve começar por aqui. Ele não executa o trabalho final, mas sim planeja, seleciona as ferramentas (skills) e orquestra a execução.

## Quando Usar
Sempre que o usuário solicitar:
- Projeto novo, site, produto, app, automação, MVP ou plataforma.
- Mudanças de escopo significativas.
- Quando o contexto exigir múltiplas etapas de desenvolvimento.

## Categorias de Skills Gerenciadas
O Orquestrador tem visibilidade sobre as seguintes categorias:

1. **Autônomos & Agentes**: `ai-agents-architect`, `autonomous-agents`, `agent-tool-builder`.
2. **Dev & Infra**: `backend-dev-guidelines`, `frontend-dev-guidelines`, `docker-expert`, `deployment-procedures`.
3. **IA & LLM**: `ai-product`, `llm-app-patterns`, `rag-related`, `crewai`, `langgraph`.
4. **Front Premium & Design**: `frontend-design`, `3d-web-experience`, `core-components`, `canvas-design`, `interactive-portfolio`.
5. **Integrações & APIs**: `firebase`, `graphql`, `file-uploads`, `email-systems`, `stripe`.
6. **Segurança**: `ethical-hacking-methodology`, `sql-injection-testing`.
7. **Growth & Produto**: `content-creator`, `copywriting`, `analytics-tracking`.

## Processo OBRIGATÓRIO (The Orchestration Flow)

### Passo 1: Entendimento Profundo
Analisar o pedido: tipo de projeto, objetivos, prazos, complexidade e stack técnica preferida.

### Passo 2: Mapeamento de Categorias
Identificar quais áreas são necessárias (Agentes? Backend? Front Premium? IA?).

### Passo 3: Seleção do Time (Skills)
Escolher explicitamente 1-3 skills por categoria marcada.
*Exemplo: "Para este projeto, usarei frontend-design e backend-dev-guidelines".*

### Passo 4: Plano de Ação
Gerar um `implementation_plan.md` estruturado em etapas lógicas.

### Passo 5: Invocação
Somente após o plano aprovado, começar a chamar as skills específicas para a execução.

> [!IMPORTANT]
> **NUNCA** comece a implementar diretamente sem passar por este fluxo de orquestração.
