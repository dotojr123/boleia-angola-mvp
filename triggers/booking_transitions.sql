-- =============================================================================
-- Trigger: validate_booking_transition
-- Descrição: Valida transições de status de booking
-- Responsabilidades:
--   - Transições válidas:
--     * pending → confirmed
--     * pending → rejected
--     * pending → cancelled
--     * confirmed → completed
--     * confirmed → cancelled
--   - Impedir transições inválidas
--   - RAISE EXCEPTION se transição inválida
-- =============================================================================

-- Drop existing function and trigger if they exist
DROP FUNCTION IF EXISTS public.validate_booking_status_transition() CASCADE;
DROP TRIGGER IF EXISTS validate_booking_transition ON public.bookings;

-- Create validation function
CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Não validar no INSERT (sempre permitido criar com status inicial)
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- =======================================================================
    -- Validação de transições de status
    -- =======================================================================

    -- pending → confirmed (permitido)
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
        RETURN NEW;
    END IF;

    -- pending → rejected (permitido)
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        RETURN NEW;
    END IF;

    -- pending → cancelled (permitido)
    IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- confirmed → completed (permitido)
    IF OLD.status = 'confirmed' AND NEW.status = 'completed' THEN
        RETURN NEW;
    END IF;

    -- confirmed → cancelled (permitido)
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- rejected/cancelled → rejected/cancelled (manter status final - permitido)
    -- Isso permite updates que não mudam o status
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- =======================================================================
    -- Transições INVÁLIDAS - RAISE EXCEPTION
    -- =======================================================================

    -- Não pode voltar de cancelled/rejected para pending/confirmed
    IF OLD.status IN ('cancelled', 'rejected') AND NEW.status IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Transição inválida: não é possível alterar status de % para %. Bookings cancelados ou rejeitados são finais.',
            OLD.status, NEW.status
        USING ERRCODE = '23000';
    END IF;

    -- Não pode ir de cancelled/rejected para completed
    IF OLD.status IN ('cancelled', 'rejected') AND NEW.status = 'completed' THEN
        RAISE EXCEPTION 'Transição inválida: não é possível completar um booking %',
            OLD.status
        USING ERRCODE = '23000';
    END IF;

    -- Não pode ir diretamente de pending para completed (precisa passar por confirmed)
    IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
        RAISE EXCEPTION 'Transição inválida: booking precisa ser confirmado antes de ser completado. Status atual: %',
            OLD.status
        USING ERRCODE = '23000';
    END IF;

    -- Não pode ir de completed para outro status
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Transição inválida: booking completado não pode ter seu status alterado',
            OLD.status
        USING ERRCODE = '23000';
    END IF;

    -- Qualquer outra transição não especificada
    RAISE EXCEPTION 'Transição de status inválida: de % para %. Transições permitidas: pending→confirmed/rejected/cancelled, confirmed→completed/cancelled',
        OLD.status, NEW.status
    USING ERRCODE = '23000';
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER validate_booking_transition
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_booking_status_transition();

-- Comentários para documentação
COMMENT ON FUNCTION public.validate_booking_status_transition() IS 'Valida transições de status de booking. Transições válidas: pending→confirmed/rejected/cancelled, confirmed→completed/cancelled';
COMMENT ON TRIGGER validate_booking_transition ON public.bookings IS 'Trigger para validar transições de status antes de UPDATE em bookings';
