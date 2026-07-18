-- =============================================================================
-- Trigger: update_available_seats
-- Descrição: Atualiza available_seats da ride quando booking é criado/modificado
-- Responsabilidades:
--   - Quando booking for criado (INSERT): decrementar available_seats
--   - Quando booking for cancelado (UPDATE status='cancelled'): incrementar available_seats
--   - Quando booking for excluído: incrementar available_seats
--   - Prevenir overbooking
-- =============================================================================

-- Drop existing function and trigger if they exist
DROP FUNCTION IF EXISTS public.update_available_seats_on_booking() CASCADE;
DROP TRIGGER IF EXISTS update_available_seats ON public.bookings;

-- Create function to handle seat updates
CREATE OR REPLACE FUNCTION public.update_available_seats_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    current_available INTEGER;
    ride_total_seats INTEGER;
BEGIN
    -- =======================================================================
    -- INSERT: Quando booking for criado
    -- =======================================================================
    IF TG_OP = 'INSERT' THEN
        -- Apenas decrementa se status for 'confirmed' ou 'pending' (reservas ativas)
        IF NEW.status IN ('confirmed', 'pending') THEN
            -- Verificar disponibilidade antes de decrementar (prevenir overbooking)
            SELECT available_seats, total_seats INTO current_available, ride_total_seats
            FROM public.rides
            WHERE id = NEW.ride_id
            FOR UPDATE;

            -- Prevenir overbooking - verificar se há assentos suficientes
            IF current_available < NEW.seats_booked THEN
                RAISE EXCEPTION 'Overbooking prevenido: assentos disponíveis (%) insuficientes para % assentos solicitados',
                    current_available, NEW.seats_booked
                USING ERRCODE = '23000';
            END IF;

            -- Decrementar available_seats da ride
            UPDATE public.rides
            SET available_seats = available_seats - NEW.seats_booked
            WHERE id = NEW.ride_id;
        END IF;

        RETURN NEW;
    END IF;

    -- =======================================================================
    -- UPDATE: Quando booking for modificado
    -- =======================================================================
    IF TG_OP = 'UPDATE' THEN
        -- Caso 1: Booking cancelado (incrementa assentos de volta)
        IF OLD.status IN ('confirmed', 'pending') AND NEW.status IN ('cancelled', 'rejected') THEN
            UPDATE public.rides
            SET available_seats = available_seats + OLD.seats_booked
            WHERE id = OLD.ride_id;

        -- Caso 2: Booking confirmado após pendência (decrementa assentos)
        ELSIF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
            SELECT available_seats INTO current_available
            FROM public.rides
            WHERE id = NEW.ride_id
            FOR UPDATE;

            IF current_available < NEW.seats_booked THEN
                RAISE EXCEPTION 'Overbooking prevenido: assentos disponíveis (%) insuficientes para % assentos solicitados',
                    current_available, NEW.seats_booked
                USING ERRCODE = '23000';
            END IF;

            UPDATE public.rides
            SET available_seats = available_seats - NEW.seats_booked
            WHERE id = NEW.ride_id;

        -- Caso 3: Mudança na quantidade de assentos (mesmo status)
        ELSIF OLD.status = NEW.status AND OLD.seats_booked != NEW.seats_booked THEN
            IF NEW.status IN ('confirmed', 'pending') THEN
                -- Ajusta diferença de assentos
                UPDATE public.rides
                SET available_seats = available_seats + OLD.seats_booked - NEW.seats_booked
                WHERE id = NEW.ride_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    -- =======================================================================
    -- DELETE: Quando booking for excluído
    -- =======================================================================
    IF TG_OP = 'DELETE' THEN
        -- Incrementa available_seats de volta se booking estava ativo
        IF OLD.status IN ('confirmed', 'pending') THEN
            UPDATE public.rides
            SET available_seats = available_seats + OLD.seats_booked
            WHERE id = OLD.ride_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger para INSERT/UPDATE
CREATE TRIGGER update_available_seats
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_available_seats_on_booking();

-- Create trigger para DELETE
CREATE TRIGGER update_available_seats_delete
    AFTER DELETE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_available_seats_on_booking();

-- Comentários para documentação
COMMENT ON FUNCTION public.update_available_seats_on_booking() IS 'Atualiza available_seats da ride quando booking é criado (INSERT), modificado (UPDATE) ou excluído (DELETE). Previne overbooking.';
COMMENT ON TRIGGER update_available_seats ON public.bookings IS 'Trigger para atualizar assentos disponíveis após INSERT/UPDATE em bookings';
COMMENT ON TRIGGER update_available_seats_delete ON public.bookings IS 'Trigger para atualizar assentos disponíveis após DELETE em bookings';
