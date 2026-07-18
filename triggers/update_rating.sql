-- =============================================================================
-- Trigger: update_user_rating
-- Descrição: Atualiza a média de ratings de um usuário após reviews
-- Responsabilidades:
--   - Calcular média de ratings após INSERT em reviews
--   - Calcular média de ratings após UPDATE em reviews
--   - Atualizar profiles.rating
--   - Atualizar profiles.reviews_count
-- =============================================================================

-- Drop existing function and trigger if they exist
DROP FUNCTION IF EXISTS public.update_user_rating_from_review() CASCADE;
DROP TRIGGER IF EXISTS update_user_rating ON public.reviews;

-- Create function
CREATE OR REPLACE FUNCTION public.update_user_rating_from_review()
RETURNS TRIGGER AS $$
DECLARE
    new_avg_rating NUMERIC;
    new_reviews_count INTEGER;
BEGIN
    -- =======================================================================
    -- INSERT: Nova review inserida
    -- =======================================================================
    IF TG_OP = 'INSERT' THEN
        -- Calcular nova média e count de reviews para o reviewee
        SELECT
            COALESCE(AVG(r.rating), 0),
            COUNT(*)::INTEGER
        INTO new_avg_rating, new_reviews_count
        FROM public.reviews r
        WHERE r.reviewee_id = NEW.reviewee_id;

        -- Atualizar profiles com nova média e count
        UPDATE public.profiles
        SET
            rating = new_avg_rating,
            reviews_count = new_reviews_count
        WHERE id = NEW.reviewee_id;

        RETURN NEW;
    END IF;

    -- =======================================================================
    -- UPDATE: Review modificada
    -- =======================================================================
    IF TG_OP = 'UPDATE' THEN
        -- Apenas recalcular se rating mudou ou reviewee mudou
        IF OLD.rating IS DISTINCT FROM NEW.rating OR OLD.reviewee_id IS DISTINCT FROM NEW.reviewee_id THEN
            -- Se mudou o reviewee, precisa atualizar ambos
            IF OLD.reviewee_id IS DISTINCT FROM NEW.reviewee_id THEN
                -- Atualizar antigo reviewee (remover review)
                SELECT COALESCE(AVG(r.rating), 0), COUNT(*)::INTEGER
                INTO new_avg_rating, new_reviews_count
                FROM public.reviews r
                WHERE r.reviewee_id = OLD.reviewee_id;

                UPDATE public.profiles
                SET
                    rating = new_avg_rating,
                    reviews_count = new_reviews_count
                WHERE id = OLD.reviewee_id;

                -- Atualizar novo reviewee (adicionar review)
                SELECT COALESCE(AVG(r.rating), 0), COUNT(*)::INTEGER
                INTO new_avg_rating, new_reviews_count
                FROM public.reviews r
                WHERE r.reviewee_id = NEW.reviewee_id;

                UPDATE public.profiles
                SET
                    rating = new_avg_rating,
                    reviews_count = new_reviews_count
                WHERE id = NEW.reviewee_id;
            ELSE
                -- Mesmo reviewee, apenas rating mudou
                UPDATE public.profiles
                SET
                    rating = (
                        SELECT COALESCE(AVG(r.rating), 0)
                        FROM public.reviews r
                        WHERE r.reviewee_id = NEW.reviewee_id
                    ),
                    reviews_count = (
                        SELECT COUNT(*)::INTEGER
                        FROM public.reviews r
                        WHERE r.reviewee_id = NEW.reviewee_id
                    )
                WHERE id = NEW.reviewee_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    -- =======================================================================
    -- DELETE: Review excluída
    -- =======================================================================
    IF TG_OP = 'DELETE' THEN
        -- Recalcular média e count para o reviewee
        SELECT
            COALESCE(AVG(r.rating), 0),
            COUNT(*)::INTEGER
        INTO new_avg_rating, new_reviews_count
        FROM public.reviews r
        WHERE r.reviewee_id = OLD.reviewee_id;

        -- Atualizar profiles
        UPDATE public.profiles
        SET
            rating = new_avg_rating,
            reviews_count = new_reviews_count
        WHERE id = OLD.reviewee_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_rating_from_review();

-- Comentários para documentação
COMMENT ON FUNCTION public.update_user_rating_from_review() IS 'Atualiza rating e reviews_count em profiles após INSERT/UPDATE/DELETE em reviews';
COMMENT ON TRIGGER update_user_rating ON public.reviews IS 'Trigger para atualizar rating do usuário após mudanças em reviews';
