-- ============================================================================
-- Boleia Angola - Row Level Security (RLS) Policies
-- PostgreSQL 17.7 + Supabase
-- Data: 2026-04-13
-- ============================================================================
-- Este arquivo contém APENAS as políticas RLS para ser aplicado em um
-- ambiente que já possui as tabelas criadas.
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS RLS POR TABELA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PROFILES
-- Regra: Perfis são públicos para leitura, mas apenas o dono pode atualizar
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Perfis: qualquer pessoa autenticada pode ver todos os perfis
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Apenas o próprio usuário pode criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Apenas o próprio usuário pode atualizar seu perfil
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Apenas o próprio usuário pode deletar seu perfil
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2.2 AUTH_CREDENTIALS
-- Regra: Apenas o próprio usuário pode acessar suas credenciais
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own auth credentials" ON public.auth_credentials;
DROP POLICY IF EXISTS "Users can insert own auth credentials" ON public.auth_credentials;
DROP POLICY IF EXISTS "Users can update own auth credentials" ON public.auth_credentials;
DROP POLICY IF EXISTS "Users can delete own auth credentials" ON public.auth_credentials;

CREATE POLICY "Users can view own auth credentials"
    ON public.auth_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auth credentials"
    ON public.auth_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auth credentials"
    ON public.auth_credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auth credentials"
    ON public.auth_credentials FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2.3 SYSTEM_SETTINGS
-- Regra: Settings são públicos para leitura, apenas admin pode alterar
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "System settings are viewable by everyone" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;

CREATE POLICY "System settings are viewable by everyone"
    ON public.system_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can update system settings"
    ON public.system_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- 2.4 VEHICLES
-- Regra: Veículos são públicos, apenas dono pode CUD
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Vehicles viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can delete own vehicles" ON public.vehicles;

CREATE POLICY "Vehicles viewable by everyone"
    ON public.vehicles FOR SELECT
    USING (true);

CREATE POLICY "Owners can insert own vehicles"
    ON public.vehicles FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own vehicles"
    ON public.vehicles FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own vehicles"
    ON public.vehicles FOR DELETE
    USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- 2.5 RIDES
-- Regra: Viagens são públicas, apenas motorista dono pode CUD
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Rides viewable by everyone" ON public.rides;
DROP POLICY IF EXISTS "Drivers can insert own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can update own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can delete own rides" ON public.rides;

CREATE POLICY "Rides viewable by everyone"
    ON public.rides FOR SELECT
    USING (true);

CREATE POLICY "Drivers can insert own rides"
    ON public.rides FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own rides"
    ON public.rides FOR UPDATE
    USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete own rides"
    ON public.rides FOR DELETE
    USING (auth.uid() = driver_id);

-- ----------------------------------------------------------------------------
-- 2.6 BOOKINGS
-- Regra:
--   - Passageiro vê apenas as suas reservas
--   - Motorista vê reservas das suas viagens
--   - Apenas passageiro pode criar reserva
--   - Apenas motorista pode atualizar status
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Passengers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can update booking status" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        -- Passageiro vê sua própria reserva
        auth.uid() = passenger_id
        OR
        -- Motorista vê reservas das suas viagens
        EXISTS (
            SELECT 1 FROM public.rides
            WHERE public.rides.id = ride_id AND public.rides.driver_id = auth.uid()
        )
    );

CREATE POLICY "Passengers can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update booking status"
    ON public.bookings FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT driver_id FROM public.rides WHERE id = ride_id
        )
    );

CREATE POLICY "Users can delete own bookings"
    ON public.bookings FOR DELETE
    USING (auth.uid() = passenger_id);

-- ----------------------------------------------------------------------------
-- 2.7 REVIEWS
-- Regra:
--   - Participantes da review podem ver
--   - Autor pode CUD
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Reviews are viewable by participants" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by participants"
    ON public.reviews FOR SELECT
    USING (
        -- Reviewer ou reviewee podem ver
        auth.uid() = reviewer_id
        OR auth.uid() = reviewee_id
        -- Ou participou da booking
        OR EXISTS (
            SELECT 1 FROM public.bookings
            WHERE public.bookings.id = booking_id
            AND (public.bookings.passenger_id = auth.uid()
                 OR public.bookings.ride_id IN (
                     SELECT id FROM public.rides WHERE driver_id = auth.uid()
                 ))
        )
    );

CREATE POLICY "Users can insert own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = reviewer_id);

-- ----------------------------------------------------------------------------
-- 2.8 MESSAGES
-- Regra:
--   - Apenas participantes da conversa podem ver/inserir
--   - Apenas remetente pode atualizar/apagar
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);

-- ----------------------------------------------------------------------------
-- 2.9 NOTIFICATIONS
-- Regra: Apenas o usuário dono pode ver/criar/atualizar/apagar
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2.10 WAYPOINTS
-- Regra:
--   - Waypoints são públicos para leitura
--   - Apenas motorista dono da ride pode CUD
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Waypoints viewable by everyone" ON public.waypoints;
DROP POLICY IF EXISTS "Drivers can insert waypoints for own rides" ON public.waypoints;
DROP POLICY IF EXISTS "Drivers can update own waypoints" ON public.waypoints;
DROP POLICY IF EXISTS "Drivers can delete own waypoints" ON public.waypoints;

CREATE POLICY "Waypoints viewable by everyone"
    ON public.waypoints FOR SELECT
    USING (true);

CREATE POLICY "Drivers can insert waypoints for own rides"
    ON public.waypoints FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rides
            WHERE public.rides.id = ride_id AND public.rides.driver_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can update own waypoints"
    ON public.waypoints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.rides
            WHERE public.rides.id = ride_id AND public.rides.driver_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can delete own waypoints"
    ON public.waypoints FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.rides
            WHERE public.rides.id = ride_id AND public.rides.driver_id = auth.uid()
        )
    );

-- ============================================================================
-- 3. RESUMO DAS POLÍTICAS
-- ============================================================================
--
-- Tabela            | Leitura                | Escrita
-- ------------------|------------------------|------------------------
-- profiles          | Todos                  | Apenas o próprio
-- auth_credentials  | Apenas o próprio       | Apenas o próprio
-- system_settings   | Todos                  | Admins
-- vehicles          | Todos                  | Apenas o dono
-- rides             | Todos                  | Apenas o motorista
-- bookings          | Passageiro/Motorista   | Passageiro (criar), Motorista (status)
-- reviews           | Participantes          | Autor
-- messages          | Participantes          | Remetente
-- notifications     | Apenas o próprio       | Apenas o próprio
-- waypoints         | Todos                  | Motorista (da ride)
--
-- ============================================================================

-- ============================================================================
-- Fim RLS Policies
-- ============================================================================
