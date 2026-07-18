-- =============================================================================
-- Trigger: set_updated_at
-- Descrição: Atualiza o campo updated_at para NOW() em INSERT/UPDATE
-- Responsabilidades:
--   - Atualizar updated_at = NOW() em INSERT/UPDATE
--   - Aplicar em todas as tabelas com timestamps
-- =============================================================================

-- Drop existing function and triggers if they exist
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at ON public.rides;
DROP TRIGGER IF EXISTS set_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS set_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS set_updated_at ON public.messages;

-- Create function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se a tabela tem coluna updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = TG_TABLE_SCHEMA
                 AND table_name = TG_TABLE_NAME
               AND column_name = 'updated_at') THEN
        NEW.updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em todas as tabelas relevantes
-- profiles
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- rides
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- bookings
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- vehicles
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- messages
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Comentários para documentação
COMMENT ON FUNCTION public.set_updated_at() IS 'Atualiza o campo updated_at para NOW() em UPDATE. Aplicado em: profiles, rides, bookings, vehicles, messages';
