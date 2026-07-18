-- Full Backup of Boleia Angola Database (Migrated from Supabase)
-- Generated on 2026-01-30

-- Clean up
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types / Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('novice', 'intermediate', 'expert', 'ambassador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ride_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    license_number TEXT,
    verification_status verification_status DEFAULT 'none',
    rating NUMERIC(10, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    experience_level experience_level DEFAULT 'novice',
    interests TEXT[],
    travel_preferences JSONB DEFAULT '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}',
    role user_role DEFAULT 'passenger',
    avg_rating NUMERIC(10, 2) DEFAULT 5.0,
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

-- 2. System Settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    make TEXT,
    model TEXT,
    year INTEGER,
    color TEXT,
    plate TEXT,
    seats_capacity INTEGER DEFAULT 4,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    category VARCHAR(20),
    comfort_level VARCHAR(20),
    comfort_stars INTEGER,
    pictures JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Rides
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    origin TEXT,
    destination TEXT,
    stops TEXT[],
    departure_time TIMESTAMPTZ,
    estimated_duration INTERVAL,
    price_per_seat NUMERIC(10, 2),
    currency TEXT DEFAULT 'Kz',
    total_seats INTEGER,
    available_seats INTEGER,
    status ride_status DEFAULT 'scheduled',
    description TEXT,
    preferences JSONB,
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
    cross_border_alert BOOLEAN DEFAULT FALSE
);

-- 5. Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    passenger_id UUID REFERENCES profiles(id),
    seats_booked INTEGER DEFAULT 1,
    total_price NUMERIC(10, 2),
    status booking_status DEFAULT 'pending',
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

-- 6. Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    reviewer_id UUID REFERENCES profiles(id),
    reviewee_id UUID REFERENCES profiles(id),
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(20),
    trip_id UUID REFERENCES rides(id),
    moderation_status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 7. Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id),
    receiver_id UUID REFERENCES profiles(id),
    ride_id UUID REFERENCES rides(id),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID REFERENCES bookings(id),
    read_at TIMESTAMPTZ
);

-- 8. Waypoints
CREATE TABLE waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
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

-- INSERT DATA
-- Profiles
INSERT INTO profiles (id, email, full_name, avatar_url, phone, verification_status, rating, reviews_count, created_at, updated_at, experience_level, travel_preferences, role, avg_rating, total_reviews, phone_verified, email_verified, rides_offered, rides_taken, response_rate) VALUES
('64600275-8aa4-437a-9337-6bb2e0949e19', 'artnaweb2022@gmail.com', 'Roberto', 'https://ui-avatars.com/api/?name=Roberto&background=0D8ABC&color=fff', NULL, 'verified', 5.00, 0, '2025-11-29 02:11:31.479964+00', '2025-11-29 02:11:31.479964+00', 'novice', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', 'driver', 5.00, 0, false, false, 0, 0, 0),
('681aeabd-1582-410c-83d3-062ea011750f', 'jose.motorista@demo.com', 'Jose Motorista', 'https://ui-avatars.com/api/?name=Jose%20Motorista&background=0D8ABC&color=fff', NULL, 'none', 5.00, 0, '2026-01-23 05:45:57.275755+00', '2026-01-23 05:45:57.275755+00', 'novice', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', 'driver', 5.00, 0, false, false, 0, 0, 0),
('af69cf7a-db7e-4c4c-be0f-06892072c90d', 'passageiro@demo.com', 'Ana Passageira', 'https://ui-avatars.com/api/?name=Ana+Passageira&background=0D8ABC&color=fff', NULL, 'none', 5.00, 0, '2026-01-23 05:45:57.300552+00', '2026-01-23 05:45:57.300552+00', 'novice', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', 'passenger', 5.00, 0, false, false, 0, 0, 0),
('d3f312ef-045e-4412-8fa2-5c01485c7307', 'admin@demo.com', 'Admin Sistema', 'https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff', '+244 923 456 791', 'verified', 5.00, 0, '2025-11-29 02:50:40.764249+00', '2025-11-29 02:50:40.764249+00', 'novice', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', 'admin', 5.00, 0, false, false, 0, 0, 0),
('02b006ff-bb39-4e0a-9890-aebe11b2d4e3', 'motorista@demo.com', 'Carlos Motorista', NULL, NULL, 'verified', 5.00, 0, '2026-01-29 01:59:01.530327+00', '2026-01-29 01:59:01.530327+00', 'novice', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', 'driver', 5.00, 0, false, false, 0, 0, 0);

-- System Settings
INSERT INTO system_settings (id, key, value, description, updated_at) VALUES
('b458a05a-df04-40ed-8151-a57a8837f409', 'commission_rate', '15', 'Taxa de comissão do sistema em porcentagem (%)', '2026-01-29 02:57:49.478716+00'),
('eeb4ee5b-0820-4c62-b547-529a74092494', 'min_commission', '500', 'Valor mínimo de comissão em AOA', '2026-01-29 02:57:49.478716+00'),
('049f9d26-a09f-46b5-9a80-52674b6decb8', 'app_name', '"Boleia Angola"', 'Nome oficial da plataforma', '2026-01-29 02:57:49.478716+00'),
('02dc9b22-f157-46c0-bd26-68633d61293d', 'support_email', '"suporte@boleiaangola.com"', 'Email de suporte ao cliente', '2026-01-29 02:57:49.478716+00'),
('1e6766d8-d256-4192-aa35-04067073116d', 'support_phone', '"+244 923 000 000"', 'Telefone de suporte oficial', '2026-01-29 02:57:49.478716+00'),
('aa49b55e-3f46-420d-a97a-ad5269bc469f', 'maintenance_mode', 'false', 'Ativa o modo de manutenção em todo o sistema', '2026-01-29 02:57:49.478716+00'),
('e0e9ae66-6eb8-439d-b8f0-7853c3be9156', 'social_links', '{"twitter": "https://twitter.com/boleiaangola", "facebook": "https://facebook.com/boleiaangola", "instagram": "https://instagram.com/boleiaangola"}', 'Links para redes sociais oficiais', '2026-01-29 02:57:49.478716+00');

-- Vehicles
INSERT INTO vehicles (id, owner_id, make, model, year, color, plate, seats_capacity, photo_url, is_active, created_at, category, comfort_level, comfort_stars, pictures, is_verified, updated_at) VALUES
('be617cd5-abd6-4baf-b54f-d4d7c9e44330', '64600275-8aa4-437a-9337-6bb2e0949e19', 'Toyota', 'Land Cruiser', 2022, 'Preto', 'LD-88-99-CC', 7, NULL, true, '2026-01-23 03:24:41.969358+00', NULL, NULL, NULL, '[]', false, '2026-01-29 00:27:54.142243+00');

-- Rides
INSERT INTO rides (id, driver_id, vehicle_id, origin, destination, stops, departure_time, estimated_duration, price_per_seat, currency, total_seats, available_seats, status, description, preferences, created_at, updated_at, baggage_policy, permanent_id, frequency, price_with_commission, distance_km, luggage_size, detour_allowed, schedule_flexibility, booking_mode, view_count, is_comfort, cross_border_alert) VALUES
('9a7298c3-d084-4e33-a962-fe33f60966e6', '64600275-8aa4-437a-9337-6bb2e0949e19', 'be617cd5-abd6-4baf-b54f-d4d7c9e44330', 'Luanda', 'Benguela', NULL, '2026-01-24 03:24:41.969358+00', NULL, 5000, 'Kz', 4, 4, 'scheduled', 'Viagem confortável saindo da Mutamba. Ar condicionado ligado.', '{"pets": false, "music": true, "smoking": false}', '2026-01-23 03:24:41.969358+00', '2026-01-23 03:24:41.969358+00', 'medium', NULL, 'UNIQUE', NULL, NULL, 'MEDIUM', 'NONE', 'FIFTEEN_MINUTES', 'manual', 0, false, false),
('44b7c3dd-df6a-4c47-80f4-234b01bcb26d', '64600275-8aa4-437a-9337-6bb2e0949e19', 'be617cd5-abd6-4baf-b54f-d4d7c9e44330', 'Luanda', 'Huambo', NULL, '2026-01-25 03:24:41.969358+00', NULL, 7000, 'Kz', 4, 4, 'scheduled', 'Viagem para o Huambo. Saída cedo.', '{"pets": false, "music": true, "smoking": false}', '2026-01-23 03:24:41.969358+00', '2026-01-23 03:24:41.969358+00', 'medium', NULL, 'UNIQUE', NULL, NULL, 'MEDIUM', 'NONE', 'FIFTEEN_MINUTES', 'manual', 0, false, false),
('80e0513e-f9c3-4d64-9457-3f33de81e7d3', '64600275-8aa4-437a-9337-6bb2e0949e19', 'be617cd5-abd6-4baf-b54f-d4d7c9e44330', 'Luanda', 'Benguela', NULL, '2026-01-30 08:00:00+00', '06:00:00', 5000, 'AOA', 3, 3, 'scheduled', 'Viagem para Benguela, saída da Mutamba.', '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}', '2026-01-29 00:27:54.402443+00', '2026-01-29 00:27:54.402443+00', NULL, NULL, 'UNIQUE', 5882.35, 532, 'MEDIUM', 'NONE', 'FIFTEEN_MINUTES', 'manual', 0, false, false);

-- Bookings
INSERT INTO bookings (id, ride_id, passenger_id, seats_booked, total_price, status, created_at, updated_at, booking_code, file_number, unit_price, commission, currency, passenger_refund, driver_compensation, expire_date, trip_is_passed, message_contact_allowed, phone_contact_allowed) VALUES
('b3017a42-7c98-444a-995f-97217db83e5a', '9a7298c3-d084-4e33-a962-fe33f60966e6', 'af69cf7a-db7e-4c4c-be0f-06892072c90d', 1, 5000, 'pending', '2026-01-23 05:46:16.892978+00', '2026-01-23 05:46:16.892978+00', NULL, NULL, 5000, 0, 'AOA', 0, 0, NULL, false, true, false);
