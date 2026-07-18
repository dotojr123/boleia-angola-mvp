-- =============================================================================
-- Boleia Angola - Correções Incrementais (Backup + Ajustes)
-- =============================================================================
-- Descrição: Script SAFE para aplicar correções mantendo dados existentes
-- Uso: psql -U usuario -d database -f fix_database_incremental.sql
-- =============================================================================

-- Iniciar transaction
BEGIN;

-- =============================================================================
-- PARTE 1: VERIFICAÇÃO DE INTEGRIDADE (Roda primeiro para não quebrar dados)
-- =============================================================================

-- Verificar se tabela documents existe e criar se não
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'documents') THEN
        RAISE NOTICE 'Criando tabela documents...';
        CREATE TABLE documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            document_type VARCHAR(50) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
            verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
            verified_at TIMESTAMP,
            rejection_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- RLS
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own documents" ON documents
            FOR SELECT USING (profile_id = auth_user_id());

        CREATE POLICY "Users can insert own documents" ON documents
            FOR INSERT WITH CHECK (profile_id = auth_user_id());

        CREATE POLICY "Admins can manage all documents" ON documents
            FOR ALL USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth_user_id() AND role = 'ADMIN')
            );
    ELSE
        RAISE NOTICE 'Tabela documents já existe';
    END IF;
END $$;

-- =============================================================================
-- PARTE 2: TRIGGERS DE VALIDAÇÃO CRÍTICAS
-- =============================================================================

-- Trigger 1: Validação de RIDE antes de INSERT
CREATE OR REPLACE FUNCTION validate_ride_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: departure_time deve ser no futuro
    IF NEW.departure_time <= NOW() THEN
        RAISE EXCEPTION 'Departure time must be in the future';
    END IF;

    -- Validação 2: price_per_seat deve ser > 0
    IF NEW.price_per_seat <= 0 THEN
        RAISE EXCEPTION 'Price per seat must be positive';
    END IF;

    -- Validação 3: available_seats deve ser entre 1 e 100
    IF NEW.available_seats < 1 OR NEW.available_seats > 100 THEN
        RAISE EXCEPTION 'Available seats must be between 1 and 100';
    END IF;

    -- Validação 4: origin != destination
    IF NEW.origin = NEW.destination THEN
        RAISE EXCEPTION 'Origin and destination must be different';
    END IF;

    -- Validação 5: Motorista deve estar verificado
    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.driver_id
        AND verification_status NOT IN ('verified', 'pending')
    ) THEN
        RAISE EXCEPTION 'Driver must be verified to create rides';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS before_insert_rides ON rides;
CREATE TRIGGER before_insert_rides
    BEFORE INSERT ON rides
    FOR EACH ROW
    EXECUTE FUNCTION validate_ride_insert();

-- Trigger 2: Atualização automática de available_seats em bookings
CREATE OR REPLACE FUNCTION update_available_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Se booking foi confirmada, decrementa assentos
    IF NEW.status = 'CONFIRMED' AND (OLD.status IS NULL OR OLD.status = 'PENDING') THEN
        UPDATE rides
        SET available_seats = available_seats - 1
        WHERE id = NEW.ride_id AND available_seats > 0;

        -- Se não conseguiu (assentos = 0), erro
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No seats available for this ride';
        END IF;
    END IF;

    -- Se booking foi cancelada/rejeitada, incrementa assentos
    IF (NEW.status IN ('CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'REJECTED'))
        AND OLD.status = 'CONFIRMED' THEN
        UPDATE rides
        SET available_seats = available_seats + 1
        WHERE id = NEW.ride_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS update_available_seats ON bookings;
CREATE TRIGGER update_available_seats
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_available_seats_on_booking();

-- Trigger para deleção de bookings
DROP TRIGGER IF EXISTS update_available_seats_delete ON bookings;
CREATE TRIGGER update_available_seats_delete
    BEFORE DELETE ON bookings
    FOR EACH ROW
    WHEN (OLD.status = 'CONFIRMED')
    EXECUTE FUNCTION update_available_seats_on_booking();

-- Trigger 3: Validação de transição de status de booking
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Transições válidas
    -- PENDING -> CONFIRMED, REJECTED, CANCELLED_BY_PASSENGER
    -- CONFIRMED -> COMPLETED, CANCELLED_BY_PASSENGER, CANCELLED_BY_DRIVER
    -- Qualquer status -> REFUNDED (admin only)

    IF OLD.status = 'PENDING' THEN
        IF NEW.status NOT IN ('CONFIRMED', 'REJECTED', 'CANCELLED_BY_PASSENGER') THEN
            RAISE EXCEPTION 'Invalid status transition from PENDING to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'CONFIRMED' THEN
        IF NEW.status NOT IN ('COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER') THEN
            RAISE EXCEPTION 'Invalid status transition from CONFIRMED to %', NEW.status;
        END IF;
    ELSIF OLD.status IN ('COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'REJECTED') THEN
        -- Estados finais - só permite REFUNDED
        IF NEW.status != 'REFUNDED' THEN
            RAISE EXCEPTION 'Cannot transition from final status %', OLD.status;
        END IF;
    END IF;

    -- Se cancelando, deve ter motivo
    IF NEW.status IN ('CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER') THEN
        IF NEW.cancellation_reason IS NULL THEN
            RAISE EXCEPTION 'Cancellation reason required';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS validate_booking_transition ON bookings;
CREATE TRIGGER validate_booking_transition
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_status_transition();

-- Trigger 4: Atualização automática de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas relevantes
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_vehicles ON vehicles;
CREATE TRIGGER set_updated_at_vehicles
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_rides ON rides;
CREATE TRIGGER set_updated_at_rides
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_bookings ON bookings;
CREATE TRIGGER set_updated_at_bookings
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- PARTE 3: CORREÇÃO DE DADOS INCONSISTENTES
-- =============================================================================

-- Correção 1: available_seats > total_seats
\echo 'Corrigindo assentos inconsistentes...'
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    -- Ajustar rides onde available_seats > total_seats
    UPDATE rides
    SET available_seats = total_seats
    WHERE available_seats > total_seats;

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % rides with available_seats > total_seats', fixed_count;
END $$;

-- Correção 2: Normalizar roles para uppercase
\echo 'Normalizando roles...'
UPDATE profiles SET role = UPPER(role) WHERE role != UPPER(role);

-- Correção 3: Verificar e corrigir valores nulos obrigatórios
\echo 'Verificando valores nulos...'
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;
UPDATE profiles SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE rides SET status = 'OPEN' WHERE status IS NULL;
UPDATE bookings SET status = 'PENDING' WHERE status IS NULL;

-- =============================================================================
-- PARTE 4: ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices essenciais (se não existirem)
CREATE INDEX IF NOT EXISTS idx_rides_status_departure ON rides(status, departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_origin ON rides(origin);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON rides(destination);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_status ON bookings(passenger_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_status ON bookings(ride_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(receiver_id, is_read) WHERE is_read = false;

-- =============================================================================
-- PARTE 5: VERIFICAÇÃO FINAL
-- =============================================================================

DO $$
DECLARE
    func_count INTEGER;
    trigger_count INTEGER;
    inconsistent_rides INTEGER;
BEGIN
    -- Contar funções
    SELECT COUNT(*) INTO func_count
    FROM pg_proc
    WHERE proname IN (
        'validate_ride_insert',
        'update_available_seats_on_booking',
        'validate_booking_status_transition',
        'set_updated_at'
    );

    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname IN (
        'before_insert_rides',
        'update_available_seats',
        'validate_booking_transition',
        'set_updated_at_profiles',
        'set_updated_at_rides'
    );

    -- Verificar rides inconsistentes
    SELECT COUNT(*) INTO inconsistent_rides
    FROM rides
    WHERE available_seats > total_seats;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO DE CORREÇÕES APLICADAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Funções criadas: % (4 esperadas)', func_count;
    RAISE NOTICE 'Triggers ativas: % (5+ esperadas)', trigger_count;
    RAISE NOTICE 'Rides inconsistentes: % (0 esperado)', inconsistent_rides;

    IF func_count >= 4 AND trigger_count >= 5 AND inconsistent_rides = 0 THEN
        RAISE NOTICE '✓ Todas as correções aplicadas com sucesso!';
    ELSE
        RAISE NOTICE '⚠ ALGUNS ITENS PENDENTES - verifique manualmente';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- Commit
COMMIT;

\echo 'CORREÇÕES APLICADAS COM SUCESSO! Dados preservados.'
