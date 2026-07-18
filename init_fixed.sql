-- 1. Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    verification_status VARCHAR(20) DEFAULT 'none',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    id_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(10, 2) DEFAULT 5.0,
    experience_level VARCHAR(20) DEFAULT 'Principiante',
    travel_preferences JSONB DEFAULT '{}'::jsonb,
    role VARCHAR(20) DEFAULT 'passenger',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rides
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_exact_point TEXT NOT NULL,  -- Could be PostGIS point or string representation
    destination_city VARCHAR(100) NOT NULL,
    destination_exact_point TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_arrival_time TIMESTAMPTZ,
    total_seats INTEGER CHECK (total_seats > 0 AND total_seats <= 15) NOT NULL,
    available_seats INTEGER CHECK (available_seats >= 0 AND available_seats <= total_seats) NOT NULL,
    price_per_seat NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',  -- e.g., scheduled, ongoing, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Waypoints
CREATE TABLE waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    exact_location TEXT NOT NULL,
    stop_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seats_booked INTEGER CHECK (seats_booked > 0) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',  -- e.g., pending, confirmed, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ride Alerts
CREATE TABLE ride_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 9. Documents (used by uploads module)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
