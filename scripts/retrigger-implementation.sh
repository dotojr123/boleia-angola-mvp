#!/bin/bash
# scripts/retrigger-implementation.sh
# Reaciona implementação para corrigir testes falhando

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Reacionando implementação para correção...${NC}"
echo ""

# Verificar resultados
RESULT_FILE="test-results/test-summary.json"
if [ ! -f "$RESULT_FILE" ]; then
    echo -e "${RED}❌ Nenhum resultado de teste encontrado${NC}"
    exit 1
fi

FAILED=$(jq '.failed' "$RESULT_FILE")

echo -e "${BLUE}📋 Testes falhando: $FAILED${NC}"
echo ""

# Analisar quais testes falharam
echo "🔍 Analisando falhas..."

if [ -f "test-results/backend-results.json" ]; then
    echo ""
    echo "Backend failures:"
    jq '.testResults[] | select(.status == "failed") | .name' test-results/backend-results.json 2>/dev/null || echo "  Nenhum failure detalhado encontrado"
fi

if [ -f "test-results/frontend-results.json" ]; then
    echo ""
    echo "Frontend failures:"
    jq '.testResults[] | select(.status == "failed") | .name' test-results/frontend-results.json 2>/dev/null || echo "  Nenhum failure detalhado encontrado"
fi

echo ""
echo "=========================================="
echo "📝 Ações sugeridas:"
echo "=========================================="
echo "1. Verificar logs de erro acima"
echo "2. Identificar causa raiz"
echo "3. Implementar correção"
echo "4. Rodar testes novamente: npm test"
echo "=========================================="
echo ""

# Notificar via hook
echo -e "${YELLOW}🔔 Notificando agentes de implementação...${NC}"
echo "IMPLEMENTATION_NEEDED=true" >> .env 2>/dev/null || true
echo "FAILED_TESTS_COUNT=$FAILED" >> .env 2>/dev/null || true

# Trigger no agent system
if [ -f ".git/hooks/post-merge" ]; then
    echo "📡 Acionando hook de correção..."
    # Implementar trigger específico
fi

echo ""
echo -e "${YELLOW}🔄 Aguardando correção...${NC}"
