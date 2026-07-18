#!/bin/bash
# =============================================================================
# Boleia Angola - Apply Triggers Script
# =============================================================================
# Script para aplicar todas as triggers e functions no banco de dados
# Uso: ./apply_triggers.sh [DB_HOST] [DB_NAME] [DB_USER]
# Exemplo: ./apply_triggers.sh localhost boleia_angola postgres
# =============================================================================

set -e

# Configurações padrão
DB_HOST=${1:-${DB_HOST:-localhost}}
DB_NAME=${2:-${DB_NAME:-boleia_angola}}
DB_USER=${3:-${DB_USER:-postgres}}

# Exporta variáveis para o PSQL
export PGHOST="$DB_HOST"
export PGDATABASE="$DB_NAME"
export PGUSER="$DB_USER"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

echo "============================================================"
echo "Boleia Angola - Apply Triggers"
echo "============================================================"
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "============================================================"
echo ""

# Verifica conexão
echo "Verificando conexão com o banco de dados..."
psql -c "SELECT 'Conexão OK!' as status;" || {
    echo "ERRO: Não foi possível conectar ao banco de dados."
    echo "Certifique-se de que as variáveis DB_HOST, DB_NAME, DB_USER e DB_PASSWORD estão configuradas."
    exit 1
}

# Aplica scripts na ordem correta
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "1/6 - Aplicando ride_validations.sql..."
psql -f "$SCRIPT_DIR/triggers/ride_validations.sql"

echo ""
echo "2/6 - Aplicando update_seats.sql..."
psql -f "$SCRIPT_DIR/triggers/update_seats.sql"

echo ""
echo "3/6 - Aplicando booking_transitions.sql..."
psql -f "$SCRIPT_DIR/triggers/booking_transitions.sql"

echo ""
echo "4/6 - Aplicando set_updated_at.sql..."
psql -f "$SCRIPT_DIR/triggers/set_updated_at.sql"

echo ""
echo "5/6 - Aplicando update_rating.sql..."
psql -f "$SCRIPT_DIR/triggers/update_rating.sql"

echo ""
echo "6/6 - Aplicando ride_stats.sql (função)..."
psql -f "$SCRIPT_DIR/functions/ride_stats.sql"

# Validação
echo ""
echo "============================================================"
echo "Validando instalação..."
echo "============================================================"

psql -c "
SELECT
    'get_ride_stats' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_ride_stats'
    ) THEN 'OK' ELSE 'FALTOU' END as status
UNION ALL
SELECT
    'validate_ride_insert' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'validate_ride_insert'
    ) THEN 'OK' ELSE 'FALTOU' END as status
UNION ALL
SELECT
    'update_available_seats_on_booking' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_available_seats_on_booking'
    ) THEN 'OK' ELSE 'FALTOU' END as status
UNION ALL
SELECT
    'validate_booking_status_transition' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'validate_booking_status_transition'
    ) THEN 'OK' ELSE 'FALTOU' END as status
UNION ALL
SELECT
    'set_updated_at' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
    ) THEN 'OK' ELSE 'FALTOU' END as status
UNION ALL
SELECT
    'update_user_rating_from_review' as function,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_user_rating_from_review'
    ) THEN 'OK' ELSE 'FALTOU' END as status;
"

echo ""
echo "============================================================"
echo "Instalação concluída com sucesso!"
echo "============================================================"
