-- Migration: Audit Fixes for BlaBlaCar-style structure
-- Adds missing columns and tables identified during full-stack audit

-- 1. Add verification and experience columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS document_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) DEFAULT 'Principiante' CHECK (experience_level IN ('Principiante', 'Intermediário', 'Experiente')),
  ADD COLUMN IF NOT EXISTS verification_badge VARCHAR(50);

-- 2. Add exact location columns and seat constraint to rides
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS pickup_zone TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_zone TEXT,
  ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb;

-- Add constraint for max 15 seats (vans/buses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'rides_max_15_seats'
  ) THEN
    ALTER TABLE rides ADD CONSTRAINT rides_max_15_seats CHECK (total_seats <= 15);
  END IF;
END $$;

-- 3. Create ride_alerts table for "Criar Alertas" feature
CREATE TABLE IF NOT EXISTS ride_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_zone TEXT,
  dropoff_zone TEXT,
  max_price NUMERIC(10, 2),
  departure_after TIMESTAMPTZ,
  departure_before TIMESTAMPTZ,
  seats_needed INTEGER DEFAULT 1 CHECK (seats_needed > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ride_alerts performance
CREATE INDEX IF NOT EXISTS idx_ride_alerts_user_id ON ride_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_alerts_origin_destination ON ride_alerts(origin, destination);
CREATE INDEX IF NOT EXISTS idx_ride_alerts_is_active ON ride_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_ride_alerts_departure_window ON ride_alerts(departure_after, departure_before);

-- 4. Create vehicle_photos table (referenced in vehicles route but missing)
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_is_primary ON vehicle_photos(is_primary);

-- 5. Add updated_at trigger for ride_alerts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ride_alerts_updated_at ON ride_alerts;
CREATE TRIGGER update_ride_alerts_updated_at
  BEFORE UPDATE ON ride_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();