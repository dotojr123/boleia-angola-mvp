-- SCRIPT SQL RÁPIDO - MICRO SEED
TRUNCATE ride_alerts, waypoints, transactions, user_documents, documents, disputes, 
         messages, bookings, reviews, rides, vehicles, admins, notifications, profiles 
         RESTART IDENTITY CASCADE;

-- Passageiros
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
SELECT 'pass' || i || '@test.ao', 'Passageiro ' || i, '+2449' || LPAD(i::TEXT,7,'0'), 
       '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz', 
       'passenger', 'verified', 4.50, NOW()
FROM generate_series(1, 20) AS i;

-- Motoristas
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
SELECT 'driver' || i || '@test.ao', 'Motorista ' || i, '+2449' || LPAD((9000000+i)::TEXT,7,'0'), 
       '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz', 
       'driver', 'verified', 4.80, NOW()
FROM generate_series(1, 10) AS i;

-- Admin
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
VALUES ('admin@test.ao', 'Admin Test', '+244999999999', '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz', 
        'admin', 'verified', 5.00, NOW());
INSERT INTO admins (profile_id) SELECT id FROM profiles WHERE role = 'admin';

-- Veículos
INSERT INTO vehicles (owner_id, make, model, year, color, is_active)
SELECT p.id, 'Toyota', 'Corolla', 2020, 'Prata', true
FROM profiles p WHERE p.role = 'driver';

-- Viagens
INSERT INTO rides (driver_id, vehicle_id, origin_city, destination_city, departure_time, price_per_seat, total_seats, available_seats, status, description, currency)
SELECT p.id, v.id, 'Luanda', 'Benguela', NOW() + (i||' day')::INTERVAL, 5000, 4, 4, 'scheduled', 'Viagem teste', 'Kz'
FROM profiles p CROSS JOIN vehicles v CROSS JOIN generate_series(1,3) AS i
WHERE p.role = 'driver' AND v.owner_id = p.id;

-- Reservas
INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status, created_at)
SELECT r.id, (SELECT id FROM profiles WHERE role='passenger' LIMIT 1), 2, r.price_per_seat*2, 'confirmed', NOW()
FROM rides r WHERE r.status='scheduled' ORDER BY random() LIMIT 10;

-- Reviews
INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, comment, created_at)
SELECT r.id, p.id, r.driver_id, 5, 'Ótimo!', NOW()
FROM rides r CROSS JOIN profiles p WHERE r.status='completed' ORDER BY r.id LIMIT 5;

-- Estatísticas
SELECT 'Total' as tipo, COUNT(*) as qtd FROM profiles WHERE role='passenger' UNION ALL
SELECT 'Motoristas', COUNT(*) FROM profiles WHERE role='driver' UNION ALL
SELECT 'Admins', COUNT(*) FROM profiles WHERE role='admin' UNION ALL
SELECT 'Veículos', COUNT(*) FROM vehicles UNION ALL
SELECT 'Viagens', COUNT(*) FROM rides UNION ALL
SELECT 'Reservas', COUNT(*) FROM bookings;\endsql
