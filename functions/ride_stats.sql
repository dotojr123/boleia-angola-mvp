-- =============================================================================
-- Função: get_ride_stats(ride_id)
-- Descrição: Retorna estatísticas de uma ride específica
-- Responsabilidades:
--   - Total arrecadado (soma de bookings confirmados)
--   - Passageiros confirmados (count)
--   - Assentos disponíveis
--   - Retornar RECORD
-- =============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_ride_stats(UUID) CASCADE;

-- Create function
CREATE OR REPLACE FUNCTION public.get_ride_stats(p_ride_id UUID)
RETURNS TABLE (
    ride_id UUID,
    total_revenue NUMERIC,          -- Total arrecadado (soma de bookings confirmados)
    confirmed_passengers INTEGER,   -- Passageiros confirmados (count)
    available_seats_count INTEGER,  -- Assentos disponíveis
    total_seats_count INTEGER,      -- Total de assentos da ride
    pending_bookings INTEGER,       -- Bookings pendentes
    cancelled_bookings INTEGER      -- Bookings cancelados
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS ride_id,
        -- Total arrecadado: soma dos preços de bookings confirmados
        COALESCE(
            (SELECT SUM(b.total_price)
             FROM public.bookings b
             WHERE b.ride_id = r.id
               AND b.status = 'confirmed'),
            0
        )::NUMERIC AS total_revenue,
        -- Passageiros confirmados: count de bookings confirmados
        COALESCE(
            (SELECT COUNT(*)::INTEGER
             FROM public.bookings b
             WHERE b.ride_id = r.id
               AND b.status = 'confirmed'),
            0
        ) AS confirmed_passengers,
        -- Assentos disponíveis
        r.available_seats AS available_seats_count,
        -- Total de assentos
        r.total_seats AS total_seats_count,
        -- Bookings pendentes
        COALESCE(
            (SELECT COUNT(*)::INTEGER
             FROM public.bookings b
             WHERE b.ride_id = r.id
               AND b.status = 'pending'),
            0
        ) AS pending_bookings,
        -- Bookings cancelados
        COALESCE(
            (SELECT COUNT(*)::INTEGER
             FROM public.bookings b
             WHERE b.ride_id = r.id
               AND b.status IN ('cancelled', 'rejected')),
            0
        ) AS cancelled_bookings
    FROM public.rides r
    WHERE r.id = p_ride_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION public.get_ride_stats(UUID) IS 'Retorna estatísticas de uma ride: total_revenue, confirmed_passengers, available_seats_count, total_seats_count, pending_bookings, cancelled_bookings';

-- Exemplo de uso:
-- SELECT * FROM public.get_ride_stats('uuid-da-ride');
