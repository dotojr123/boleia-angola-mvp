#!/bin/bash
# scripts/validate-results.sh
# Valida resultados dos testes e decide próximo passo

set -e

RESULT_FILE="test-results/test-summary.json"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Validando resultados dos testes..."

if [ ! -f "$RESULT_FILE" ]; then
    echo -e "${RED}❌ Arquivo de resultados não encontrado: $RESULT_FILE${NC}"
    exit 1
fi

# Ler resultados
TOTAL=$(jq '.total' "$RESULT_FILE")
PASSED=$(jq '.passed' "$RESULT_FILE")
FAILED=$(jq '.failed' "$RESULT_FILE")
SUCCESS_RATE=$(jq '.success_rate' "$RESULT_FILE")

echo ""
echo "📊 Resultados:"
echo "  Total: $TOTAL"
echo -e "  Passou: ${GREEN}$PASSED${NC}"
echo -e "  Falhou: ${RED}$FAILED${NC}"
echo "  Taxa de Sucesso: $SUCCESS_RATE%"
echo ""

# Verificar se todos passaram
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ 100% de sucesso!${NC}"
    echo ""
    echo "STATUS=APPROVED" >> "$GITHUB_ENV" 2>/dev/null || true
    echo "VALIDATION_PASSED=true" >> .env 2>/dev/null || true

    # Criar tag de versão se for CI
    if [ -n "$GITHUB_SHA" ]; then
        echo "🏷️  Criando tag de versão..."
        git tag "test-passed-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
    fi

    echo ""
    echo "🚀 Pronto para deploy!"
    exit 0
else
    echo -e "${RED}❌ Testes falharam: $FAILED${NC}"
    echo ""
    echo "STATUS=REQUIRES_REVIEW" >> "$GITHUB_ENV" 2>/dev/null || true
    echo "VALIDATION_PASSED=false" >> .env 2>/dev/null || true

    # Listar testes falhando
    echo ""
    echo "📋 Testes falhando:"
    if [ -f "test-results/backend-results.json" ]; then
        echo "  Backend: Verificar test-results/backend-results.json"
    fi
    if [ -f "test-results/frontend-results.json" ]; then
        echo "  Frontend: Verificar test-results/frontend-results.json"
    fi

    # Criar issue automaticamente se for CI
    if [ -n "$GITHUB_SHA" ]; then
        echo ""
        echo "🎫 Criando issue para correção..."
        # gh issue create --title "🐛 Correção necessária: $FAILED testes falharam" --body "Os seguintes testes falharam. Verificar logs no CI." --label "bug" 2>/dev/null || true
    fi

    echo ""
    echo "🔄 Acionando re-correção..."
    exit 1
fi
