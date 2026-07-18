-- =====================================================
-- SCRIPTSQL DE MOCK DE DADOS VOLUMOSOS — Boleia Angola
-- =====================================================
-- Objetivo: Popular banco com dados realistas para testes E2E
-- Executar: psql -U postgres -d boleia_angola -f seed_data.sql
-- =====================================================

-- 1. REMOVER DADOS EXISTENTES (opcional)
-- TRUNCATE reviews, bookings, rides, vehicles, alerts, profiles RESTART IDENTITY CASCADE;

-- 2. GERAR PERIFÉRIOS (基业)
-- Criar 50 passageiros
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

-- AHO 30 motoristas
INSERT INTO profiles (email, full_name, phone, role, verification_status, rating, reviews_count, created_at)
SELECT
  'driver' || i || '@boleia.ao',
  (ARRAY['Carlos', 'Paulo', 'Miguel', 'Rui', 'Nuno', 'Paulo', 'Filipe', 'Ricardo', 'Daniel', 'Bruno'])[1 + (i % 10)] || ' ' ||
  (ARRAY['Almeida', 'Monteiro', 'Carvalho', 'Gomes', 'Rocha', 'Marques', 'Reis', 'Nogueira', 'Soares', 'Proprio'])[1 + ((i/10) % 10)],
  '+2449' || LPAD((9000000 + i)::TEXT, 7, '0'),
  'driver',
  'verified',  -- Todos verified para poder criar viagens
  ROUND((3.5 + (i % 150) / 100.0)::NUMERIC, 2),
  i % 100,
  NOW() - (random() * INTERVAL '730 days')
FROM generate_series(1, 30) AS i;

-- 1 admin
INSERT INTO profiles (email, full_name, phone, role, verification_status, rating, reviews_count, created_at)
VALUES
  ('admin@boleia.ao', 'Administrador Sistema', '+244999999999', 'admin', 'verified', 5.00, 0, NOW());

-- 3. GERAR VEÍCULOS (2-3 por motorista)
INSERT INTO vehicles (owner_id, make, model, year, color, license_plate, capacity, is_active)
SELECT
  p.id,
  (ARRAY['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'BMW', 'Mercedes', 'Audi'])[1 + (v % 8)],
  (ARRAY['Corolla', 'Civic', 'Elantra', 'Sportage', 'Golf', '3-series', 'C-Class', 'A4'])[1 + (v % 8)],
  2015 + (v % 9),
  (ARRAY['Prata', 'Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Bege'])[1 + (v % 7)],
  'B' || LPAD((v).__TEXT, 3, '0') || random()::INT % 10,
  4 + (v % 4),  -- 4-7 assentos
  true
FROM profiles p
CROSS JOIN generate_series(1, 2 + (RANDOM() * 2)::INT) AS v
WHERE p.role = 'driver';

-- 4. GERAR VIAGENS (3-8 por motorista)
INSERT INTO rides (driver_id, origin_city, destination_city, departure_time, price_per_seat, total_seats, available_seats, vehicle_id, status, description, waypoints)
SELECT
  p.id,
  (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[d % 8],
  (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[(d + 1 + (i % 7)) % 8],
  NOW() + ((i + d * 100) % 60) * INTERVAL '1 day' + (i % 24) * INTERVAL '1 hour',
  2000 + (i * 150) % 8000,
  4 + (d % 3),
  4 + (d % 3),
  v.id,
  (ARRAY['scheduled', 'scheduled', 'scheduled', 'active', 'completed', 'cancelled'])[1 + (i % 6)],
  'Viagem confortável com ar condicionado e música ambiente',
  '[]'
FROM profiles p
CROSS JOIN profiles v
ON p.id = v.owner_id
CROSS JOIN generate_series(1, 3 + (RANDOM() * 5)::INT) AS i
WHERE p.role = 'driver';

-- 5. GERAR RESERVAS (1-4 assentos por viagem com reservas)
INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status, created_at)
SELECT
  r.id,
  (SELECT id FROM profiles WHERE role = 'passenger' ORDER BY random() LIMIT 1),
  1 + (random() * 3)::INT,
  0,  -- Será calculado com UPDATE
  (ARRAY['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'])[1 + (b % 5)],
  NOW() - (random() * INTERVAL '30 days')
FROM rides r
WHERE r.status IN ('scheduled', 'active')
CROSS JOIN generate_series(1, (1 + (RANDOM() * 4)::INT)) AS b
WHERE random() < 0.7;  -- 70% das viagens tem reservas

-- Calcular total_price correto
UPDATE bookings b
SET total_price = (r.price_per_seat * b.seats_booked)
FROM rides r
WHERE b.ride_id = r.id;

-- Decrementar available_seats nas rides
UPDATE rides r
SET available_seats = r.total_seats - (
  SELECT COALESCE(SUM(seats_booked), 0)
  FROM bookings b
  WHERE b.ride_id = r.id AND b.status = 'confirmed'
)
WHERE r.status IN ('scheduled', 'active');

-- 6. GERAR AVALIAÇÕES (apenas em viagens completadas)
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at)
SELECT
  b.id,
  b.passenger_id,
  r.driver_id,
  3 + (random() * 2)::INT,  -- 3-5 estrelas
  (ARRAY[
    'Ótima viagem! Motorista muito simpático e pontual.',
    'Carro limpo e confortável. Recomendo!',
    'Simplesmente perfeito. Voltarei a viajar com este motorista.',
    'Bom serviço, mas poderia ser mais rápido.',
    'Experiência excelente. Motorista muito profissional.'
  ])[(b.id % 5) + 1],
  b.created_at + random() * INTERVAL '10 days'
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE r.status = 'completed' AND random() < 0.6;  -- 60% das viagens completadas tem review

-- Calcular ratings médios nos perfis
UPDATE profiles p
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating), 2)
    FROM reviews r
    WHERE r.reviewee_id = p.id
  ), 5.00),
  reviews_count = COALESCE((
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.reviewee_id = p.id
  ), 0);

-- 7. GERAR ALERTAS (0-3 por dia, últimos 30 dias)
INSERT INTO alerts (reporter_id, target_user_id, target_ride_id, alert_type, reason, status, created_at)
SELECT
  (SELECT id FROM profiles WHERE role = 'passenger' ORDER BY random() LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'driver' ORDER BY random() LIMIT 1),
  (SELECT id FROM rides WHERE status != 'cancelled' ORDER BY random() LIMIT 1),
  (ARRAY['hostile', 'unsafe', 'fraud', 'other'])[1 + (i % 4)],
  (ARRAY[
    'Motorista foi agressivo durante a viagem.',
    'Veículo em más condições, parecia perigoso.',
    'Cobrança diferente do anunciado na plataforma.',
    'Outro problema durante a viagem.'
  ])[(i % 4) + 1],
  (ARRAY['pending', 'pending', 'reviewed', 'resolved', 'dismissed'])[1 + (i % 5)],
  NOW() - (i * INTERVAL '1 day')
FROM generate_series(1, 15) AS i
WHERE random() < 0.15;  -- 15% de chance de criar alerta por iteração

-- 8. GERAR NOTIFICAÇÕES (opcional - se tiver tabela)
-- INSERT INTO notifications (user_id, title, content, type, is_read, link, created_at)
-- SELECT ... FROM ...;

-- 9. GERAR MENSAGENS (opcional - se tiver conversa ativa)
-- INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
-- SELECT ... FROM ...;

-- =====================================================
-- ESTATÍSTICAS FINAIS
-- =====================================================
SELECT 'Profiles' as tabela, COUNT(*) as registo, role FROM profiles GROUP BY role
UNION ALL
SELECT 'Veículos', COUNT(*), NULL FROM vehicles
UNION ALL
SELECT 'Viagens', COUNT(*), NULL FROM rides WHERE status = 'scheduled'
UNION ALL
SELECT 'Viagens Ativas', COUNT(*), NULL FROM rides WHERE status = 'active'
UNION ALL
SELECT 'Reservas Confirmadas', COUNT(*), NULL FROM bookings WHERE status = 'confirmed'
UNION ALL
SELECT 'Reservas Pendentes', COUNT(*), NULL FROM bookings WHERE status = 'pending'
UNION ALL
SELECT 'Avaliações', COUNT(*), NULL FROM reviews
UNION ALL
SELECT 'Alertas', COUNT(*), NULL FROM alerts;

-- =====================================================
-- LOGIN PARA TESTES (Credenciais já existem no BD)
-- =====================================================
-- Email: admin@boleia.ao
-- Senha: (precisa criar no sistema de auth)
--
-- Para testes auth, você precisa:
-- 1. Criar auth_credentials para cada profile
-- 2. OU descomentar e usar os demo accounts (se quiser manter)
-- =====================================================

-- 10. CRIAR AUTH_CREDENTIALS (se a tabela existir)
-- INSERT INTO auth_credentials (user_id, email, password_hash)
-- SELECT
--   id,
--   email,
--   '$2a$10$' || MD5(random()::TEXT) -- Placeholder, usar bcrypt real
-- FROM profiles
-- WHERE role IN ('driver', 'passenger')
-- LIMIT 10;

-- NOTA: Para autenticação funcional, você precisa:
-- 1. Hash real das senhas com bcrypt
-- 2. OU descomentar as credenciais de demo do Login.tsx
-- =====================================================