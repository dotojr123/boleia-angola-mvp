#!/bin/bash
# scripts/run-tests.sh
# Script principal para executar todos os testes

set -e

echo "🧪 =========================================="
echo "🧪 Iniciando suite de testes - Boleia Angola"
echo "🧪 =========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. Backend Tests
echo -e "${YELLOW}[1/4] Backend Tests${NC}"
cd server
if npm test -- --json --outputFile=../test-results/backend-results.json; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
cd ..
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 2. Frontend Tests
echo -e "${YELLOW}[2/4] Frontend Tests${NC}"
if npm test -- --run --json --outputFile=test-results/frontend-results.json; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 3. Integration Tests
echo -e "${YELLOW}[3/4] Integration Tests${NC}"
if npm run test:integration 2>&1 | tee test-results/integration-output.log; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Integration tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 4. E2E Tests (opcional, pode falhar se não houver servidor)
echo -e "${YELLOW}[4/4] E2E Tests${NC}"
if npm run test:e2e 2>&1 | tee test-results/e2e-output.log; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ E2E tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Gerar resumo
echo ""
echo "=========================================="
echo "📊 Resumo dos Testes"
echo "=========================================="
echo "Total: $TOTAL_TESTS"
echo "Passou: $PASSED_TESTS"
echo "Falhou: $FAILED_TESTS"
echo "=========================================="

# Gerar JSON de resultados
cat > test-results/test-summary.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "total": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "coverage": 0,
  "success_rate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
}
EOF

# Decidir status final
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ 100% dos testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ Testes falharam: $FAILED_TESTS${NC}"
    exit 1
fi
