-- ============================================
-- MIGRAÇÃO COMPLETA - FALTANDO COLUNAS
-- Baseado no esquema BlaBlaCar
-- ============================================

BEGIN;

-- ============================================
-- 1. PERFIL DE USUÁRIO (profiles)
-- ============================================

-- Colunas de verificação de identidade
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_rejected_reason TEXT;

-- Colunas sociais e de reputação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_trips INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancellation_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;

-- Preferências do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'pt';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'AOA';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Luanda';

-- Configurações de notificação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT false;

-- Segurança
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100);

-- Endereço
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'AO';

-- Social
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apple_id VARCHAR(100);

-- Timestamps adicionais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- ============================================
-- 2. VIAGENS (rides) - Colunas faltando
-- ============================================

-- Detalhes da viagem
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_type VARCHAR(20) DEFAULT 'DRIVER'; -- DRIVER ou OWNER
ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'SEDAN';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS comfort_class VARCHAR(20) DEFAULT 'ECONOMY';

-- Status e políticas
ALTER TABLE rides ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) DEFAULT 'MANUAL'; -- MANUAL ou INSTANT
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(20) DEFAULT 'MODERATE';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS luggage_policy VARCHAR(20) DEFAULT 'ONE_BAG';

-- Bagagem
ALTER TABLE rides ADD COLUMN IF NOT EXISTS luggage_allowance INTEGER DEFAULT 1;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS luggage_price NUMERIC(10,2) DEFAULT 0.00;

-- Preferências e amenities
ALTER TABLE rides ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS ac_available BOOLEAN DEFAULT true;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS wifi_available BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS phone_charging BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS child_seat_available BOOLEAN DEFAULT false;

-- Acessibilidade
ALTER TABLE rides ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN DEFAULT false;

-- Preço e pagamento
ALTER TABLE rides ADD COLUMN IF NOT EXISTS price_breakdown JSONB; -- {base: 1000, fuel: 200, service: 100}
ALTER TABLE rides ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'AOA';

-- Rota
ALTER TABLE rides ADD COLUMN IF NOT EXISTS route_geometry TEXT; -- Polyline ou GeoJSON
ALTER TABLE rides ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8,2);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Recorrência
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20); -- DAILY, WEEKLY, MONTHLY
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS parent_ride_id UUID;

-- Visibilidade
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Estatísticas
ALTER TABLE rides ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS inquiries_count INTEGER DEFAULT 0;

-- Timestamps
ALTER TABLE rides ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_by UUID;

-- ============================================
-- 3. RESERVAS (bookings) - Colunas faltando
-- ============================================

-- Código e referência
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(20);

-- Passageiros e assentos
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_details JSONB; -- Nomes, idades se crianças

-- Preço e pagamento
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'AOA';

-- Status de pagamento
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING'; -- PENDING, PAID, REFUNDED
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);

-- Cancelamento
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by_uuid UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Timestamps
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Mensagens
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- ============================================
-- 4. VEÍCULOS (vehicles) - Colunas faltando
-- ============================================

-- Especificações
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission VARCHAR(10) DEFAULT 'MANUAL';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) DEFAULT 'PETROL';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_size INTEGER; -- cc
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS horsepower INTEGER;

-- Características
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors INTEGER DEFAULT 4;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS luggage_capacity INTEGER DEFAULT 1;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS features JSONB; -- [air_conditioning, gps, bluetooth]

-- Documentação
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspection_expiry DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_doc_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT;

-- Status
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS verification_rejected_reason TEXT;

-- Estatísticas
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC(12,2) DEFAULT 0;

-- ============================================
-- 5. MENSAGENS (messages) - Colunas faltando
-- ============================================

-- Tipo e status
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'TEXT'; -- TEXT, IMAGE, SYSTEM
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SENT'; -- SENT, DELIVERED, READ

-- Conteúdo
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Metadados
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Relacionamento com booking
ALTER TABLE messages ADD COLUMN IF NOT EXISTS booking_id UUID;

-- ============================================
-- 6. AVALIAÇÕES (reviews) - Colunas faltando
-- ============================================

-- Detalhes da avaliação
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_type VARCHAR(20) DEFAULT 'RIDE'; -- RIDE, DRIVER, PASSENGER
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID;

-- Critérios específicos
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comfort_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS safety_rating INTEGER;

-- Status
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_response BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_created_at TIMESTAMP;

-- Utilidade
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;

-- ============================================
-- 7. TABELAS NOVAS NECESSÁRIAS
-- ============================================

-- 7.1. Waypoints (paradas intermediárias)
CREATE TABLE IF NOT EXISTS waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    name VARCHAR(255),
    address TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    arrival_time TIMESTAMP,
    departure_time TIMESTAMP,
    stop_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS waypoints_ride_id_idx ON waypoints(ride_id);
CREATE INDEX IF NOT EXISTS waypoints_sequence_idx ON waypoints(ride_id, sequence_number);

-- 7.2. Booking passengers (passageiros múltiplos por reserva)
CREATE TABLE IF NOT EXISTS booking_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS booking_passengers_booking_id_idx ON booking_passengers(booking_id);

-- 7.3. Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'AOA',
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_transactions_booking_id_idx ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON payment_transactions(status);

-- 7.4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_via_push BOOLEAN DEFAULT true,
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- 7.5. User documents (documentos de verificação)
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- LICENSE, ID_CARD, PASSPORT, VEHICLE_REGISTRATION
    document_number VARCHAR(100),
    front_url TEXT NOT NULL,
    back_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    rejection_reason TEXT,
    expires_at DATE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_documents_user_id_idx ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS user_documents_status_idx ON user_documents(status);

-- 7.6. Ride favorites (favoritos de viagens)
CREATE TABLE IF NOT EXISTS ride_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, ride_id)
);
CREATE INDEX IF NOT EXISTS ride_favorites_user_id_idx ON ride_favorites(user_id);
CREATE INDEX IF NOT EXISTS ride_favorites_ride_id_idx ON ride_favorites(ride_id);

-- 7.7. Ride reports (denúncias)
CREATE TABLE IF NOT EXISTS ride_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ride_reports_ride_id_idx ON ride_reports(ride_id);
CREATE INDEX IF NOT EXISTS ride_reports_reporter_id_idx ON ride_reports(reporter_id);

-- 7.8. System settings (configurações do sistema)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS system_settings_key_idx ON system_settings(setting_key);

-- Inserir configurações padrão
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
    ('app.name', 'Boleia Angola', 'STRING', 'Nome do aplicativo', true),
    ('app.support_email', 'suporte@boleia.ao', 'STRING', 'Email de suporte', true),
    ('app.support_phone', '+244 900 000 000', 'STRING', 'Telefone de suporte', true),
    ('commission.rate', '0.15', 'DECIMAL', 'Taxa de comissão (15%)', false),
    ('commission.min', '500', 'DECIMAL', 'Comissão mínima em AOA', false),
    ('booking.instant.enabled', 'true', 'BOOLEAN', 'Habilitar reservas instantâneas', false),
    ('max.seats.per_booking', '4', 'INTEGER', 'Máximo de assentos por reserva', false),
    ('cancellation.free.minutes', '1440', 'INTEGER', 'Minutos para cancelamento grátis (24h)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 7.9. Activity logs (auditoria)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at);

-- ============================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

-- Índices em profiles
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_verification_status_idx ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);

-- Índices em rides
CREATE INDEX IF NOT EXISTS rides_driver_id_idx ON rides(driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON rides(status);
CREATE INDEX IF NOT EXISTS rides_departure_time_idx ON rides(departure_time);
CREATE INDEX IF NOT EXISTS rides_origin_destination_idx ON rides(origin, destination);
CREATE INDEX IF NOT EXISTS rides_created_at_idx ON rides(created_at);

-- Índices em bookings
CREATE INDEX IF NOT EXISTS bookings_passenger_id_idx ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS bookings_ride_id_idx ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at);

-- Índices em messages
CREATE INDEX IF NOT EXISTS messages_ride_id_idx ON messages(ride_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- ============================================
-- 9. TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em tabelas com updated_at
DO $$
BEGIN
    -- Rides
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rides_updated_at') THEN
        CREATE TRIGGER rides_updated_at
            BEFORE UPDATE ON rides
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Bookings
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bookings_updated_at') THEN
        CREATE TRIGGER bookings_updated_at
            BEFORE UPDATE ON bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Vehicles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'vehicles_updated_at') THEN
        CREATE TRIGGER vehicles_updated_at
            BEFORE UPDATE ON vehicles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;

-- ============================================
-- RESUMO
-- ============================================
-- Esta migração adiciona:
-- - 30+ colunas em profiles
-- - 25+ colunas em rides
-- - 15+ colunas em bookings
-- - 10+ colunas em vehicles
-- - 8+ colunas em messages
-- - 8+ colunas em reviews
-- - 9 tabelas novas
-- - 20+ índices
-- - Triggers automáticos
-- ============================================
