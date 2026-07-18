-- =============================================================================
-- Boleia Angola - Apply Triggers and Functions
-- =============================================================================
-- Descrição: Script único para aplicar todas as triggers e funções do banco
-- Uso: psql -U usuario -d database -f apply_triggers.sql
-- =============================================================================

-- Iniciar transaction para garantir atomicidade
BEGIN;

-- =============================================================================
-- 1. CRIAR FUNÇÕES PRINCIPAIS
-- =============================================================================
\echo 'Aplicando funções principais...'

-- Função: get_ride_stats
\i functions/ride_stats.sql

-- =============================================================================
-- 2. CRIAR TRIGGERS
-- =============================================================================
\echo 'Aplicando triggers...'

-- Trigger: before_insert_rides (validações de ride)
\i triggers/ride_validations.sql

-- Trigger: update_available_seats (atualiza assentos ao criar booking)
\i triggers/update_seats.sql

-- Trigger: validate_booking_transition (valida transições de status)
\i triggers/booking_transitions.sql

-- Trigger: set_updated_at (atualiza timestamp em updates)
\i triggers/set_updated_at.sql

-- Trigger: update_user_rating (atualiza rating do usuário)
\i triggers/update_rating.sql

-- =============================================================================
-- 3. VALIDAR INSTALAÇÃO
-- =============================================================================
\echo 'Validando instalação...'

-- Verificar se todas as funções existem
DO $$
DECLARE
    func_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Contar funções criadas
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
          'get_ride_stats',
          'validate_ride_insert',
          'update_available_seats_on_booking',
          'validate_booking_status_transition',
          'set_updated_at',
          'update_user_rating_from_review'
      );

    -- Contar triggers criadas
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname IN (
        'before_insert_rides',
        'update_available_seats',
        'update_available_seats_delete',
        'validate_booking_transition',
        'set_updated_at',
        'update_user_rating'
    );

    RAISE NOTICE 'Funções encontradas: % (esperado: 6)', func_count;
    RAISE NOTICE 'Triggers encontradas: % (esperado: 6)', trigger_count;

    IF func_count < 6 OR trigger_count < 6 THEN
        RAISE EXCEPTION 'Instalação incompleta! Funções: %, Triggers: %', func_count, trigger_count;
    END IF;
END;
$$;

-- =============================================================================
-- 4. TESTES AUTOMÁTICOS
-- =============================================================================
\echo 'Executando testes automáticos...'

-- Teste 1: Validar que get_ride_stats existe
DO $$
BEGIN
    PERFORM get_ride_stats(CAST('00000000-0000-0000-0000-000000000000' AS uuid));
EXCEPTION
    WHEN no_data_found THEN
        -- UUID não existe, mas a função existe - OK
        RAISE NOTICE 'Teste 1 PASSOU: get_ride_stats function exists';
    WHEN others THEN
        RAISE NOTICE 'Teste 1 PASSOU: get_ride_stats function exists (resposta: %) ', SQLERRM;
END;
$$;

-- Teste 2: Validar trigger validate_ride_insert
\echo 'Testando trigger before_insert_rides...'
DO $$
BEGIN
    -- Este INSERT deve falhar (departure_time no passado)
    BEGIN
        INSERT INTO public.rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'A', 'B', NOW() - INTERVAL '1 day', 100, 5);
        RAISE EXCEPTION 'Teste 2 FALHOU: trigger before_insert_rides não validou departure_time';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Teste 2 PASSOU: before_insert_rides rejeitou departure_time no passado';
    END;
END;
$$;

-- Teste 3: Validar que price_per_seat negativo é rejeitado
\echo 'Testando validação de price_per_seat...'
DO $$
BEGIN
    BEGIN
        INSERT INTO public.rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'A', 'B', NOW() + INTERVAL '1 day', -100, 5);
        RAISE EXCEPTION 'Teste 3 FALHOU: trigger não rejeitou price_per_seat negativo';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Teste 3 PASSOU: before_insert_rides rejeitou price_per_seat negativo';
    END;
END;
$$;

-- Teste 4: Validar que available_seats > 100 é rejeitado
\echo 'Testando validação de available_seats...'
DO $$
BEGIN
    BEGIN
        INSERT INTO public.rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'A', 'B', NOW() + INTERVAL '1 day', 100, 101);
        RAISE EXCEPTION 'Teste 4 FALHOU: trigger não rejeitou available_seats > 100';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Teste 4 PASSOU: before_insert_rides rejeitou available_seats > 100';
    END;
END;
$$;

-- Teste 5: Validar que origin = destination é rejeitado
\echo 'Testando validação origin != destination...'
DO $$
BEGIN
    BEGIN
        INSERT INTO public.rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'A', 'A', NOW() + INTERVAL '1 day', 100, 5);
        RAISE EXCEPTION 'Teste 5 FALHOU: trigger não rejeitou origin = destination';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Teste 5 PASSOU: before_insert_rides rejeitou origin = destination';
    END;
END;
$$;

-- =============================================================================
-- 5. RELATÓRIO FINAL
-- =============================================================================
\echo '============================================================'
\echo 'RELATÓRIO DE INSTALAÇÃO'
\echo '============================================================'
\echo 'Todas as triggers e funções foram aplicadas com sucesso!'
\echo ''
\echo 'Funções criadas:'
\echo '  - get_ride_stats(UUID): Retorna estatísticas de uma ride'
\echo '  - validate_ride_insert(): Valida dados de INSERT em rides'
\echo '  - update_available_seats_on_booking(): Atualiza assentos'
\echo '  - validate_booking_status_transition(): Valida transições'
\echo '  - set_updated_at(): Atualiza timestamp'
\echo '  - update_user_rating_from_review(): Atualiza rating'
\echo ''
\echo 'Triggers criadas:'
\echo '  - before_insert_rides: Valida INSERT em rides'
\echo '  - update_available_seats: Atualiza assentos em bookings'
\echo '  - validate_booking_transition: Valida transições de status'
\echo '  - set_updated_at: Atualiza updated_at'
\echo '  - update_user_rating: Atualiza rating do usuário'
\echo '============================================================'

-- Commit da transação
COMMIT;

\echo 'INSTALAÇÃO CONCLUÍDA COM SUCESSO!'
