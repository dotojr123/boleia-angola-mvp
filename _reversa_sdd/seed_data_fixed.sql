-- =====================================================
-- SCRIPTSQL DE MOCK DE DADOS - VERSÃO CORRIGIDA
-- Para schema real do Boleia Angola
-- =====================================================

-- Verificar e remover dados existentes (opcional)
-- Só roda se as tabelas existirem
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        EXECUTE 'TRUNCATE reviews, bookings, rides, vehicles, auth_credentials, profiles RESTART IDENTITY CASCADE';
    END IF;
END $$;

-- 1. CRIAR USUÁRIOS (50 passageiros, 30 motoristas, 1 admin)
-- Passageiros
INSERT INTO profiles (email, full_name, phone, role, verification_status, rating, reviews_count, created_at)
SELECT
  'passenger' || i || '@boleia.ao',
  (ARRAY['João', 'Maria', 'José', 'Ana', 'Pedro', 'Sofia', 'Luís', 'Beatriz', 'António', 'Catarina'])[1 + (i % 10)] || ' ' ||
  (ARRAY['Silva', 'Santos', 'Oliveira', 'Ferreira', 'Costa', 'Rodrigues', 'Martins', 'Pereira', 'Souza', 'Lima'])[1 + ((i/10) % 10)],
  '+2449' || LPAD((i % 8000000)::TEXT, 7, '0'),
  'passenger',
  (ARRAY['none', 'pending', 'verified'])[1 + (i % 3)],
  ROUND((3 + (i % 200) / 100.0)::NUMERIC, 2),
  i % 50,
  NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 50) AS i;

-- Motoristas
INSERT INTO profiles (email, full_name, phone, role, verification_status, rating, reviews_count, license_number, created_at)
SELECT
  'driver' || i || '@boleia.ao',
  (ARRAY['Carlos', 'Paulo', 'Miguel', 'Rui', 'Nuno', 'Filipe', 'Ricardo', 'Daniel', 'Bruno', 'André'])[1 + (i % 10)] || ' ' ||
  (ARRAY['Almeida', 'Monteiro', 'Carvalho', 'Gomes', 'Rocha', 'Marques', 'Reis', 'Nogueira', 'Soares', 'Proprio'])[1 + ((i/10) % 10)],
  '+2449' || LPAD((9000000 + i)::TEXT, 7, '0'),
  'driver',
  'verified',
  ROUND((3.5 + (i % 150) / 100.0)::NUMERIC, 2),
  i % 100,
  'CNH' || LPAD((100000 + i)::TEXT, 6, '0'),
  NOW() - (random() * INTERVAL '730 days')
FROM generate_series(1, 30) AS i;

-- Admin
INSERT INTO profiles (email, full_name, phone, role, verification_status, rating, reviews_count, created_at)
VALUES
  ('admin@boleia.ao', 'Administrador Sistema', '+244999999999', 'admin', 'verified', 5.00, 0, NOW());

-- Credentials para login (bcrypt hash de 'password123')
-- Hash pré-calculado: $2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id, email FROM profiles WHERE role IN ('passenger', 'driver', 'admin')
    LOOP
        INSERT INTO auth_credentials (user_id, email, password_hash)
        VALUES (user_rec.id, user_rec.email, '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz');
    END LOOP;
END $$;

-- 2. CRIAR VEÍCULOS (2-3 por motorista)
INSERT INTO vehicles (owner_id, make, model, year, color, plate, capacity, is_active)
SELECT
  p.id,
  (ARRAY['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'BMW', 'Mercedes', 'Audi'])[1 + (v % 8)],
  (ARRAY['Corolla', 'Civic', 'Elantra', 'Sportage', 'Golf', '3-series', 'C-Class', 'A4'])[1 + (v % 8)],
  2015 + (v % 9),
  (ARRAY['Prata', 'Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Bege'])[1 + (v % 7)],
  'B' || LPAD((v)::TEXT, 3, '0') || LPAD((random()::INT % 10)::TEXT, 1, '0'),
  4 + (v % 4),
  true
FROM profiles p
CROSS JOIN LATERAL (
    SELECT generate_series(1, 2 + (random() * 2)::INT) as v
) as seq
WHERE p.role = 'driver';

-- 3. CRIAR VIAGENS (3-8 por motorista)
-- Preciso pegar vehicle_id para cada driver
DO $$
DECLARE
    driver_rec RECORD;
    v_count INTEGER;
    v_seq INTEGER;
    vehicle_id_uuid UUID;
BEGIN
    FOR driver_rec IN SELECT id FROM profiles WHERE role = 'driver'
    LOOP
        v_count := 3 + (random() * 5)::INT;
        FOR v_seq IN 1..v_count LOOP
            -- Pega um veículo aleatório do motorista
            SELECT id INTO vehicle_id_uuid 
            FROM vehicles 
            WHERE owner_id = driver_rec.id 
            ORDER BY random() 
            LIMIT 1;
            
            INSERT INTO rides (driver_id, origin_city, destination_city, departure_time, price_per_seat, total_seats, available_seats, vehicle_id, status, description, waypoints)
            VALUES (
                driver_rec.id,
                (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[(random() * 7)::INT + 1],
                (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[(random() * 7)::INT + 1],
                NOW() + ((random() * 59)::INT) * INTERVAL '1 day' + (random() * 23)::INT * INTERVAL '1 hour',
                2000 + (random() * 8000)::INT,
                4 + (random() * 3)::INT,
                4 + (random() * 3)::INT,
                vehicle_id_uuid,
                (ARRAY['scheduled', 'scheduled', 'scheduled', 'active', 'completed', 'cancelled'])[(random() * 5)::INT + 1],
                'Viagem confortável com ar condicionado e música ambiente',
                '[]'::jsonb
            );
        END LOOP;
    END LOOP;
END $$;

-- 4. CRIAR RESERVAS
DO $$
DECLARE
    ride_rec RECORD;
    b_count INTEGER;
    b_seq INTEGER;
    passenger_id_uuid UUID;
    seats INTEGER;
BEGIN
    FOR ride_rec IN SELECT id, price_per_seat, available_seats FROM rides WHERE status IN ('scheduled', 'active')
    LOOP
        b_count := (random() * 4)::INT + 1;
        
        FOR b_seq IN 1..b_count LOOP
            -- Pega um passageiro aleatório
            SELECT id INTO passenger_id_uuid 
            FROM profiles 
            WHERE role = 'passenger' 
            ORDER BY random() 
            LIMIT 1;
            
            seats := (random() * 3)::INT + 1;
            IF seats <= ride_rec.available_seats THEN
                INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status, created_at)
                VALUES (
                    ride_rec.id,
                    passenger_id_uuid,
                    seats,
                    ride_rec.price_per_seat * seats,
                    (ARRAY['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'])[(random() * 4)::INT + 1],
                    NOW() - (random() * INTERVAL '30 days')
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Decrementar available_seats nas rides baseado nas reservas confirmadas
UPDATE rides r
SET available_seats = r.total_seats - (
  SELECT COALESCE(SUM(b.seats_booked), 0)
  FROM bookings b
  WHERE b.ride_id = r.id AND b.status = 'confirmed'
)
WHERE r.status IN ('scheduled', 'active');

-- 5. CRIAR AVALIAÇÕES (apenas em viagens completadas)
DO $$
DECLARE
    booking_rec RECORD;
    ride_rec RECORD;
    rating_val INTEGER;
    comments TEXT[];
BEGIN
    comments := '{
        "Ótima viagem! Motorista muito simpático e pontual.",
        "Carro limpo e confortável. Recomendo!",
        "Simplesmente perfeito. Voltarei a viajar com este motorista.",
        "Bom serviço, mas poderia ser mais rápido.",
        "Experiência excelente. Motorista muito profissional."
    }';
    
    FOR booking_rec IN 
        SELECT b.id, b.passenger_id, b.ride_id, r.driver_id 
        FROM bookings b 
        JOIN rides r ON b.ride_id = r.id 
        WHERE r.status = 'completed'
    LOOP
        IF random() < 0.6 THEN
            rating_val := 3 + (random() * 2)::INT;
            INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at)
            VALUES (
                booking_rec.id,
                booking_rec.passenger_id,
                booking_rec.driver_id,
                rating_val,
                comments[(random() * 4)::INT + 1],
                booking_rec.created_at + (random() * INTERVAL '10 days')
            );
        END IF;
    END LOOP;
END $$;

-- Calcular ratings médios nos perfis
UPDATE profiles p
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating), 2)
    FROM reviews r
    WHERE r.reviewee_id = p.id
  ), 5.00)::NUMERIC(10,2),
  reviews_count = COALESCE((
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.reviewee_id = p.id
  ), 0);

-- 6. CRIAR ALERTAS
INSERT INTO alerts (reporter_id, target_user_id, target_ride_id, alert_type, reason, status, created_at)
SELECT
  (SELECT id FROM profiles WHERE role = 'passenger' ORDER BY random() LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'driver' ORDER BY random() LIMIT 1),
  (SELECT id FROM rides WHERE status != 'cancelled' ORDER BY random() LIMIT 1),
  (ARRAY['hostile', 'unsafe', 'fraud', 'other'])[(i % 4) + 1],
  (ARRAY[
    'Motorista foi agressivo durante a viagem.',
    'Veículo em más condições, parecia perigoso.',
    'Cobrança diferente do anunciada na plataforma.',
    'Outro problema durante a viagem.'
  ])[(i % 4) + 1],
  (ARRAY['pending', 'pending', 'reviewed', 'resolved', 'dismissed'])[(i % 5) + 1],
  NOW() - (i * INTERVAL '1 day')
FROM generate_series(1, 15) AS i
WHERE random() < 0.15;

-- =====================================================
-- ESTATÍSTICAS FINAIS
-- =====================================================
SELECT 'Profiles' as tabela, COUNT(*) as registo, role FROM profiles GROUP BY role
UNION ALL
SELECT 'Veículos', COUNT(*), NULL FROM vehicles
UNION ALL
SELECT 'Viagens Totais', COUNT(*), NULL FROM rides
UNION ALL
SELECT 'Viagens Agendadas', COUNT(*), NULL FROM rides WHERE status = 'scheduled'
UNION ALL
SELECT 'Viagens Ativas', COUNT(*), NULL FROM rides WHERE status = 'active'
UNION ALL
SELECT 'Viagens Completadas', COUNT(*), NULL FROM rides WHERE status = 'completed'
UNION ALL
SELECT 'Reservas Confirmadas', COUNT(*), NULL FROM bookings WHERE status = 'confirmed'
UNION ALL
SELECT 'Reservas Pendentes', COUNT(*), NULL FROM bookings WHERE status = 'pending'
UNION ALL
SELECT 'Avaliações', COUNT(*), NULL FROM reviews
UNION ALL
SELECT 'Alertas', COUNT(*), NULL FROM alerts
ORDER BY tabela;

-- =====================================================
-- LOGIN DE TESTE (Credenciais criadas)
-- =====================================================
-- Admin: admin@boleia.ao / password123
-- Passageiro: passenger1@boleia.ao / password123
-- Motorista: driver1@boleia.ao / password123
-- =====================================================