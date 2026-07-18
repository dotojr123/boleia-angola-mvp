-- ===================================================================
-- MIGRAÇÃO: FASE 2 - Índices e Triggers de Performance
-- ===================================================================

-- ---------------------------------------------------------------
-- 1. ÍNDICES PARA PROFILES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_rides_offered ON profiles(rides_offered DESC);

-- ---------------------------------------------------------------
-- 2. ÍNDICES PARA RIDES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_departure_time ON rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_origin_destination ON rides(origin, destination);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_rides_permanent_id ON rides(permanent_id);
CREATE INDEX IF NOT EXISTS idx_rides_frequency ON rides(frequency);

-- ---------------------------------------------------------------
-- 3. ÍNDICES PARA BOOKINGS
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);

-- ---------------------------------------------------------------
-- 4. ÍNDICES PARA MESSAGES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);

-- ---------------------------------------------------------------
-- 5. ÍNDICES PARA VEHICLES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active);

-- ---------------------------------------------------------------
-- 6. ÍNDICES PARA WAYPOINTS
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_waypoints_ride ON waypoints(ride_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_city ON waypoints(city);

-- ---------------------------------------------------------------
-- 7. ÍNDICES PARA REVIEWS
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON reviews(trip_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- ---------------------------------------------------------------
-- 8. TRIGGER FUNÇÃO: update_updated_at_column (global)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- 9. APLICAR TRIGGERS updated_at EM TODAS AS TABELAS
-- ---------------------------------------------------------------
DO $$ BEGIN
    -- rides
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_rides_updated_at') THEN
        CREATE TRIGGER trigger_rides_updated_at
        BEFORE UPDATE ON rides FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- bookings
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_bookings_updated_at') THEN
        CREATE TRIGGER trigger_bookings_updated_at
        BEFORE UPDATE ON bookings FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- profiles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_profiles_updated_at') THEN
        CREATE TRIGGER trigger_profiles_updated_at
        BEFORE UPDATE ON profiles FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- vehicles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_vehicles_updated_at') THEN
        CREATE TRIGGER trigger_vehicles_updated_at
        BEFORE UPDATE ON vehicles FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- reviews
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_updated_at') THEN
        -- reviews não tem updated_at, vamos apenas garantir
        RAISE NOTICE 'reviews table has no updated_at column - skipping trigger';
    END IF;

    -- messages
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_messages_updated_at') THEN
        -- messages não tem updated_at, vamos apenas garantir
        RAISE NOTICE 'messages table has no updated_at column - skipping trigger';
    END IF;

    -- waypoints
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_waypoints_updated_at') THEN
        -- waypoints não tem updated_at, vamos apenas garantir
        RAISE NOTICE 'waypoints table has no updated_at column - skipping trigger';
    END IF;

    -- payment_transactions
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_payment_transactions_updated_at') THEN
        CREATE TRIGGER trigger_payment_transactions_updated_at
        BEFORE UPDATE ON payment_transactions FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- user_documents
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_user_documents_updated_at') THEN
        CREATE TRIGGER trigger_user_documents_updated_at
        BEFORE UPDATE ON user_documents FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ===================================================================
-- VERIFICAÇÃO FINAL
-- ===================================================================
SELECT '✅ Migração Fase 2 concluída!' as status;