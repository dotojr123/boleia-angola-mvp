-- =============================================================================
-- Trigger: before_insert_rides
-- Descrição: Valida dados de uma ride antes da inserção
-- Responsabilidades:
--   - Validar departure_time > NOW()
--   - Validar price_per_seat > 0
--   - Validar available_seats > 0 e <= 100
--   - Validar origin != destination
--   - RAISE EXCEPTION se inválido
-- =============================================================================

-- Drop existing function and trigger if they exist
DROP FUNCTION IF EXISTS public.validate_ride_insert() CASCADE;
DROP TRIGGER IF EXISTS before_insert_rides ON public.rides;

-- Create validation function
CREATE OR REPLACE FUNCTION public.validate_ride_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar departure_time > NOW()
    -- A partida deve ser no futuro
    IF NEW.departure_time <= NOW() THEN
        RAISE EXCEPTION 'departure_time deve ser um horário no futuro. Fornecido: %', NEW.departure_time
        USING ERRCODE = '23000';
    END IF;

    -- Validar price_per_seat > 0
    -- O preço por assento deve ser positivo
    IF NEW.price_per_seat <= 0 THEN
        RAISE EXCEPTION 'price_per_seat deve ser maior que zero. Fornecido: %', NEW.price_per_seat
        USING ERRCODE = '23000';
    END IF;

    -- Validar available_seats > 0 e <= 100
    -- Assentos disponíveis deve estar entre 1 e 100
    IF NEW.available_seats <= 0 OR NEW.available_seats > 100 THEN
        RAISE EXCEPTION 'available_seats deve estar entre 1 e 100. Fornecido: %', NEW.available_seats
        USING ERRCODE = '23000';
    END IF;

    -- Validar origin != destination
    -- Origem e destino devem ser diferentes
    IF NEW.origin = NEW.destination THEN
        RAISE EXCEPTION 'origin e destination devem ser diferentes. Origem: %, Destino: %', NEW.origin, NEW.destination
        USING ERRCODE = '23000';
    END IF;

    -- Validações passaram - retorna NEW para continuar a operação
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER before_insert_rides
    BEFORE INSERT ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_ride_insert();

-- Comentários para documentação
COMMENT ON FUNCTION public.validate_ride_insert() IS 'Valida dados de uma ride antes da inserção: departure_time no futuro, price_per_seat > 0, available_seats entre 1-100, origin != destination';
COMMENT ON TRIGGER before_insert_rides ON public.rides IS 'Trigger para validar dados de rides antes de INSERT';
