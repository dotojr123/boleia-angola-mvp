-- ============================================================================
-- Boleia Angola - Migration Unificada e Completa
-- PostgreSQL 15+ / Supabase
-- Data: 2026-04-13
-- Versão: 5.0 (Unificada)
-- ============================================================================
-- Este script unifica todas as tabelas, tipos, índices, triggers e políticas
-- RLS para o sistema Boleia Angola.
-- Baseado na análise do schema real e correção de inconsistências.
-- ============================================================================

-- Iniciar transação
BEGIN;

-- ============================================================================
-- 1. LIMPEZA E EXTENSÕES
-- ============================================================================

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ============================================================================
-- 2. ENUMS / TYPES
-- ============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Verification status
DO $$ BEGIN
    CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected', 'none');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Experience level
DO $$ BEGIN
    CREATE TYPE public.experience_level AS ENUM ('novice', 'intermediate', 'expert', 'ambassador');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ride status
DO $$ BEGIN
    CREATE TYPE public.ride_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Booking status
DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABELAS PRINCIPAIS
-- ============================================================================

-- 3.1 PERFIS (Users & Drivers)
-- Extende Supabase Auth. Armazena info pública para Passageiros e Motoristas.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    license_number TEXT,
    verification_status public.verification_status DEFAULT 'none',
    rating NUMERIC(10, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    experience_level public.experience_level DEFAULT 'novice',
    interests TEXT[],
    travel_preferences JSONB DEFAULT '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}'::jsonb,
    role public.user_role DEFAULT 'passenger',
    avg_rating NUMERIC(10, 2) DEFAULT 5.00,
    total_reviews INTEGER DEFAULT 0,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    gender VARCHAR(20),
    birthdate DATE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    rides_offered INTEGER DEFAULT 0,
    rides_taken INTEGER DEFAULT 0,
    response_rate INTEGER DEFAULT 0
);

-- 3.2 CREDENCIAL DE AUTENTICAÇÃO (Auth alternativo)
CREATE TABLE IF NOT EXISTS public.auth_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 VEÍCULOS (para Motoristas)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    plate TEXT,
    seats_capacity INTEGER NOT NULL DEFAULT 4,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category VARCHAR(20),
    comfort_level VARCHAR(20),
    comfort_stars INTEGER,
    pictures JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE
);

-- 3.5 VIAGENS (Rides)
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    stops TEXT[],
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_duration INTERVAL,
    price_per_seat NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'Kz',
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    status public.ride_status DEFAULT 'scheduled',
    description TEXT,
    preferences JSONB DEFAULT '{"smoking": false, "pets": false, "music": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    baggage_policy VARCHAR(20),
    permanent_id VARCHAR(100),
    frequency VARCHAR(20),
    price_with_commission NUMERIC(10, 2),
    distance_km INTEGER,
    luggage_size VARCHAR(20),
    detour_allowed VARCHAR(20),
    schedule_flexibility VARCHAR(50),
    booking_mode VARCHAR(20),
    view_count INTEGER DEFAULT 0,
    is_comfort BOOLEAN DEFAULT FALSE,
    cross_border_alert BOOLEAN DEFAULT FALSE,
    instant_booking BOOLEAN DEFAULT FALSE
);

-- 3.6 RESERVAS (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seats_booked INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    status public.booking_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    booking_code VARCHAR(10),
    file_number VARCHAR(20),
    unit_price NUMERIC(10, 2),
    commission NUMERIC(10, 2),
    currency VARCHAR(3),
    passenger_refund NUMERIC(10, 2) DEFAULT 0,
    driver_compensation NUMERIC(10, 2) DEFAULT 0,
    expire_date TIMESTAMPTZ,
    trip_is_passed BOOLEAN DEFAULT FALSE,
    message_contact_allowed BOOLEAN DEFAULT TRUE,
    phone_contact_allowed BOOLEAN DEFAULT FALSE
);

-- 3.7 AVALIAÇÕES (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(20),
    trip_id UUID REFERENCES public.rides(id),
    moderation_status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 3.8 MENSAGENS (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    ride_id UUID REFERENCES public.rides(id),
    booking_id UUID REFERENCES public.bookings(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 3.9 NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 PONTOS DE ROTA (Waypoints)
CREATE TABLE IF NOT EXISTS public.waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    order_index INTEGER,
    type TEXT[],
    city VARCHAR(100),
    address TEXT,
    country_code VARCHAR(2) DEFAULT 'AO',
    arrival_datetime TIMESTAMPTZ,
    departure_datetime TIMESTAMPTZ,
    price_to_next NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 DOCUMENTOS (Document Uploads)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ÍNDICES CRÍTICOS PARA PERFORMANCE
-- ============================================================================

-- 4.1 PERFIS
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles USING btree (verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role_verification ON public.profiles USING btree (role, verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles USING btree (rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at);

-- 4.2 VIAGENS (rides)
CREATE INDEX IF NOT EXISTS idx_rides_origin ON public.rides USING btree (origin);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON public.rides USING btree (destination);
CREATE INDEX IF NOT EXISTS idx_rides_origin_destination ON public.rides USING btree (origin, destination);
CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON public.rides USING btree (departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides USING btree (status);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides USING btree (driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_id ON public.rides USING btree (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rides_available_seats ON public.rides USING btree (available_seats);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON public.rides USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_frequency ON public.rides USING btree (frequency);
CREATE INDEX IF NOT EXISTS idx_rides_view_count ON public.rides USING btree (view_count DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status_departure ON public.rides USING btree (status, departure_time);

-- 4.3 RESERVAS (bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings USING btree (passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON public.bookings USING btree (ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_status ON public.bookings USING btree (passenger_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings USING btree (booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_expire_date ON public.bookings USING btree (expire_date);

-- 4.4 MENSAGENS (messages)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages USING btree (is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages USING btree (booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON public.messages USING btree (ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread_by_receiver ON public.messages USING btree (receiver_id, created_at) WHERE is_read = false;

-- 4.5 AVALIAÇÕES (reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews USING btree (booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews USING btree (reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews USING btree (rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews USING btree (moderation_status);

-- 4.6 VEÍCULOS (vehicles)
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON public.vehicles USING btree (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles USING btree (plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles USING btree (created_at);

-- 4.7 NOTIFICAÇÕES (notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);

-- 4.8 WAYPOINTS
CREATE INDEX IF NOT EXISTS idx_waypoints_ride_id ON public.waypoints USING btree (ride_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_order_index ON public.waypoints USING btree (order_index);
CREATE INDEX IF NOT EXISTS idx_waypoints_city ON public.waypoints USING btree (city);
CREATE INDEX IF NOT EXISTS idx_waypoints_country_code ON public.waypoints USING btree (country_code);

-- 4.9 AUTH_CREDENTIALS
CREATE INDEX IF NOT EXISTS idx_auth_credentials_user_id ON public.auth_credentials USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_email ON public.auth_credentials USING btree (email);

-- 4.10 SYSTEM_SETTINGS
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings USING btree (key);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
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
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- 6.1 PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- 6.2 AUTH_CREDENTIALS
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

-- 6.3 SYSTEM_SETTINGS
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

-- 6.4 VEHICLES
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

-- 6.5 RIDES
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

-- 6.6 BOOKINGS
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Passengers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can update booking status" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        auth.uid() = passenger_id
        OR EXISTS (
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

-- 6.7 REVIEWS
DROP POLICY IF EXISTS "Reviews are viewable by participants" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by participants"
    ON public.reviews FOR SELECT
    USING (
        auth.uid() = reviewer_id
        OR auth.uid() = reviewee_id
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

-- 6.8 MESSAGES
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

-- 6.9 NOTIFICATIONS
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

-- 6.10 WAYPOINTS
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

-- 6.11 DOCUMENTS
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

CREATE POLICY "Users can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 7. TRIGGERS E FUNÇÕES
-- ============================================================================

-- 7.1 Trigger para criar profile automaticamente ao criar usuário no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se existir e recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7.2 Atualizar available_seats quando booking mudar de status
CREATE OR REPLACE FUNCTION public.update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando booking é confirmado, reduz assentos disponíveis
    IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
        UPDATE public.rides
        SET available_seats = GREATEST(0, available_seats - NEW.seats_booked)
        WHERE id = NEW.ride_id;

    -- Quando booking é cancelado, devolve assentos
    ELSIF (NEW.status = 'cancelled' OR NEW.status = 'rejected')
        AND (OLD.status = 'confirmed') THEN
        UPDATE public.rides
        SET available_seats = LEAST(total_seats, available_seats + NEW.seats_booked)
        WHERE id = NEW.ride_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_available_seats();

-- 7.3 Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar triggers de updated_at para tabelas que precisam
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_vehicles ON public.vehicles;
CREATE TRIGGER set_updated_at_vehicles
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rides ON public.rides;
CREATE TRIGGER set_updated_at_rides
    BEFORE UPDATE ON public.rides
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
CREATE TRIGGER set_updated_at_bookings
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 7.4 Calcular rating médio do usuário após review
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza rating médio do reviewee
    UPDATE public.profiles
    SET
        avg_rating = (
            SELECT COALESCE(AVG(rating), 5.0)
            FROM public.reviews
            WHERE reviewee_id = NEW.reviewee_id AND rating IS NOT NULL
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE reviewee_id = NEW.reviewee_id
        )
    WHERE id = NEW.reviewee_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- ============================================================================
-- 8. DADOS INICIAIS (Seed Data)
-- ============================================================================

-- Configurações do sistema
INSERT INTO public.system_settings (key, value, description) VALUES
    ('commission_rate', '15', 'Taxa de comissão do sistema em porcentagem (%)'),
    ('min_commission', '500', 'Valor mínimo de comissão em AOA'),
    ('app_name', '"Boleia Angola"', 'Nome oficial da plataforma'),
    ('support_email', '"suporte@boleiaangola.com"', 'Email de suporte ao cliente'),
    ('support_phone', '"+244 923 000 000"', 'Telefone de suporte oficial'),
    ('maintenance_mode', 'false', 'Ativa o modo de manutenção em todo o sistema'),
    ('social_links', '{"twitter": "https://twitter.com/boleiaangola", "facebook": "https://facebook.com/boleiaangola", "instagram": "https://instagram.com/boleiaangola"}'::jsonb, 'Links para redes sociais oficiais')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();

-- ============================================================================
-- 9. CORREÇÃO DE INCONSISTÊNCIAS
-- ============================================================================

-- Garantir que todos os campos NOT NULL tenham valor padrão
ALTER TABLE public.rides ALTER COLUMN origin SET NOT NULL;
ALTER TABLE public.rides ALTER COLUMN destination SET NOT NULL;
ALTER TABLE public.rides ALTER COLUMN departure_time SET NOT NULL;
ALTER TABLE public.rides ALTER COLUMN price_per_seat SET NOT NULL;
ALTER TABLE public.rides ALTER COLUMN total_seats SET NOT NULL;
ALTER TABLE public.rides ALTER COLUMN available_seats SET NOT NULL;

-- Garantir consistência nos campos de vehicles
ALTER TABLE public.vehicles ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN make SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN model SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN seats_capacity SET NOT NULL;

-- Garantir consistência nos campos de bookings
ALTER TABLE public.bookings ALTER COLUMN ride_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN passenger_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN seats_booked SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN total_price SET NOT NULL;

-- Garantir consistência nos campos de messages
ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN receiver_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;

-- Garantir consistência nos campos de notifications
ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN content SET NOT NULL;

-- Garantir consistência nos campos de documents
ALTER TABLE public.documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN document_type SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN document_url SET NOT NULL;

-- Garantir consistência nos campos de auth_credentials
ALTER TABLE public.auth_credentials ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.auth_credentials ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.auth_credentials ALTER COLUMN password_hash SET NOT NULL;

-- Garantir consistência nos campos de system_settings
ALTER TABLE public.system_settings ALTER COLUMN key SET NOT NULL;

-- ============================================================================
-- 10. ESTATÍSTICAS PARA O QUERY PLANNER
-- ============================================================================

ANALYZE public.profiles;
ANALYZE public.rides;
ANALYZE public.bookings;
ANALYZE public.messages;
ANALYZE public.reviews;
ANALYZE public.vehicles;
ANALYZE public.notifications;
ANALYZE public.waypoints;
ANALYZE public.auth_credentials;
ANALYZE public.system_settings;
ANALYZE public.documents;

-- Commit final
COMMIT;

-- ============================================================================
-- Fim da Migration Unificada
-- ============================================================================
