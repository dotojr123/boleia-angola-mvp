-- =====================================================
-- SCRIPT SQL DE MOCK DE DADOS - VERSÃO FINAL CORRIGIDA
-- Schema real do Boleia Angola
-- =====================================================

-- TRUNCAR tabelas existentes (ordem correta de foreign keys)
TRUNCATE ride_alerts, waypoints, transactions, user_documents, documents, disputes, 
         messages, bookings, reviews, bookings, rides, vehicles, admins, notifications,
         profiles RESTART IDENTITY CASCADE;

-- 1. CRIAR USUÁRIOS
-- Passageiros (50)
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
SELECT
  'passenger' || i || '@boleia.ao',
  (ARRAY['João', 'Maria', 'José', 'Ana', 'Pedro', 'Sofia', 'Luís', 'Beatriz', 'António', 'Catarina'])[1 + (i %% 10)] || ' ' ||
  (ARRAY['Silva', 'Santos', 'Oliveira', 'Ferreira', 'Costa', 'Rodrigues', 'Martins', 'Pereira', 'Souza', 'Lima'])[1 + ((i/10) %% 10)],
  '+2449' || LPAD((i %% 8000000)::TEXT, 7, '0'),
  '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz',
  'passenger',
  (ARRAY['none', 'pending', 'verified'])[1 + (i %% 3)],
  ROUND((3 + (i %% 200) / 100.0)::NUMERIC, 2),
  NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 50) AS i;

-- Motoristas (30)
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
SELECT
  'driver' || i || '@boleia.ao',
  (ARRAY['Carlos', 'Paulo', 'Miguel', 'Rui', 'Nuno', 'Filipe', 'Ricardo', 'Daniel', 'Bruno', 'André'])[1 + (i %% 10)] || ' ' ||
  (ARRAY['Almeida', 'Monteiro', 'Carvalho', 'Gomes', 'Rocha', 'Marques', 'Reis', 'Nogueira', 'Soares', 'Proprio'])[1 + ((i/10) %% 10)],
  '+2449' || LPAD((9000000 + i)::TEXT, 7, '0'),
  '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz',
  'driver',
  'verified',
  ROUND((3.5 + (i %% 150) / 100.0)::NUMERIC, 2),
  NOW() - (random() * INTERVAL '730 days')
FROM generate_series(1, 30) AS i;

-- Admin (1)
INSERT INTO profiles (email, full_name, phone, password_hash, role, verification_status, rating, created_at)
VALUES
  ('admin@boleia.ao', 'Administrador Sistema', '+244999999999', '$2a$10$X8.O5Q.YWGJ6kZQYJqN3U.0CvqVLN5r7WYJ6YzQJ6YzQJ6YzQJ6Yz', 'admin', 'verified', 5.00, NOW());

-- Create admin record
INSERT INTO admins (profile_id)
SELECT id FROM profiles WHERE role = 'admin';

-- 2. VEÍCULOS (2-3 por motorista)
INSERT INTO vehicles (owner_id, make, model, year, color, is_active)
SELECT
  p.id,
  (ARRAY['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'BMW', 'Mercedes', 'Audi'])[1 + (v %% 8)],
  (ARRAY['Corolla', 'Civic', 'Elantra', 'Sportage', 'Golf', '3-series', 'C-Class', 'A4'])[1 + (v %% 8)],
  2015 + (v %% 9),
  (ARRAY['Prata', 'Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Bege'])[1 + (v %% 7)],
  true
FROM profiles p
CROSS JOIN LATERAL (
    SELECT generate_series(1, 2 + (random() * 2)::INT) as v
) as seq
WHERE p.role = 'driver';

-- Fotos de veículos (3 por veículo)
INSERT INTO vehicle_photos (vehicle_id, url, is_primary)
SELECT
  v.id,
  'https://images.unsplash.com/photo-' || LPAD((i)::TEXT, 11, '0') || '?auto=format&fit=crop&w=800',
  i = 1
FROM vehicles v
CROSS JOIN generate_series(1, 3) AS i;

-- 3. VIAGENS (3-8 por motorista)
INSERT INTO rides (driver_id, vehicle_id, origin_city, destination_city, departure_time, price_per_seat, total_seats, available_seats, status, description, currency)
SELECT
  p.id,
  (SELECT id FROM vehicles WHERE owner_id = p.id ORDER BY random() LIMIT 1),
  (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[(random() * 7)::INT + 1],
  (ARRAY['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Malanje', 'Namibe', 'Cabinda', 'Soyo'])[(random() * 7)::INT + 1],
  NOW() + ((random() * 59)::INT) * INTERVAL '1 day' + (random() * 23)::INT * INTERVAL '1 hour',
  2000 + (random() * 8000)::INT,
  4 + (random() * 3)::INT,
  4 + (random() * 3)::INT,
  (ARRAY['scheduled', 'scheduled', 'scheduled', 'active', 'completed', 'cancelled'])[(random() * 5)::INT + 1],
  'Viagem confortável com ar condicionado e música ambiente',
  'Kz'
FROM profiles p
CROSS JOIN generate_series(1, 3 + (random() * 5)::INT)
WHERE p.role = 'driver';

-- 4. RESERVAS
INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status, created_at)
SELECT
  r.id,
  (SELECT id FROM profiles WHERE role = 'passenger' ORDER BY random() LIMIT 1),
  LEAST((random() * 3)::INT + 1, r.available_seats),
  r.price_per_seat * LEAST((random() * 3)::INT + 1, r.available_seats),
  (ARRAY['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'])[(random() * 4)::INT + 1],
  NOW() - (random() * INTERVAL '30 days')
FROM rides r
WHERE r.status IN ('scheduled', 'active')
AND random() < 0.7;

-- Atualizar available_seats
UPDATE rides r
SET available_seats = GREATEST(r.total_seats - (
  SELECT COALESCE(SUM(b.seats_booked), 0)
  FROM bookings b
  WHERE b.ride_id = r.id AND b.status = 'confirmed'
), 0)
WHERE r.status IN ('scheduled', 'active');

-- 5. AVALIAÇÕES
INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, comment, created_at)
SELECT
  b.ride_id,
  b.passenger_id,
  r.driver_id,
  3 + (random() * 2)::INT,
  (ARRAY[
    'Ótima viagem! Motorista muito simpático e pontual.',
    'Carro limpo e confortável. Recomendo!',
    'Simplesmente perfeito. Voltarei a viajar com este motorista.',
    'Bom serviço, mas poderia ser mais rápido.',
    'Experiência excelente. Motorista muito profissional.'
  ])[(random() * 4)::INT + 1],
  b.created_at + (random() * INTERVAL '10 days')
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE r.status = 'completed'
AND random() < 0.6;

-- Atualizar ratings nos perfis
UPDATE profiles p
SET rating = COALESCE((
  SELECT ROUND(AVG(r.rating), 2)
  FROM reviews r
  WHERE r.reviewee_id = p.id
), 5.00)::NUMERIC(10,2)
WHERE p.role IN ('driver', 'passenger');

-- 6. ALERTAS
INSERT INTO ride_alerts (passenger_id, ride_id, alert_type, reason, status, created_at)
SELECT
  (SELECT id FROM profiles WHERE role = 'passenger' ORDER BY random() LIMIT 1),
  (SELECT id FROM rides WHERE status != 'cancelled' ORDER BY random() LIMIT 1),
  (ARRAY['hostile', 'unsafe', 'fraud', 'other'])[(i %% 4) + 1],
  (ARRAY[
    'Motorista foi agressivo durante a viagem.',
    'Veículo em más condições, parecia perigoso.',
    'Cobrança diferente do anunciada na plataforma.',
    'Outro problema durante a viagem.'
  ])[(i %% 4) + 1],
  (ARRAY['pending', 'pending', 'reviewed', 'resolved', 'dismissed'])[(i %% 5) + 1],
  NOW() - (i * INTERVAL '1 day')
FROM generate_series(1, 15) AS i
WHERE random() < 0.15;

-- 8. NOTIFICAÇÕES (algumas para cada usuário)
INSERT INTO notifications (user_id, title, content, type, is_read, created_at)
SELECT
  p.id,
  (ARRAY['Nova viagem disponível!', 'Sua reserva foi confirmada', 'Novo review recebido', 'Mensagem não lida', 'Oferta especial'])[i %% 5 + 1],
  (ARRAY['Tem uma nova viagem no seu rota favorito.', 'Your booking for Luanda-Benguela is confirmed.', 'Você recebeu 5 estrelas!', 'Você tem uma nova mensagem.', 'Preço especial para viagens em até 3 dias.'])[i %% 5 + 1],
  (ARRAY['info', 'booking', 'review', 'message', 'promotion'])[i %% 5 + 1],
  i %% 3 = 0,
  NOW() - (random() * INTERVAL '7 days')
FROM profiles p
CROSS JOIN generate_series(1, 3 + (random() * 3)::INT) AS i;

-- =====================================================
-- ESTATÍSTICAS FINAIS
-- =====================================================
SELECT 'Usuários (Passageiros)' as estatistica, COUNT(*) as total FROM profiles WHERE role = 'passenger'
UNION ALL
SELECT 'Usuários (Motoristas)', COUNT(*) FROM profiles WHERE role = 'driver'
UNION ALL
SELECT 'Usuários (Admin)', COUNT(*) FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 'Veículos', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Viagens Totais', COUNT(*) FROM rides
UNION ALL
SELECT 'Viagens Agendadas', COUNT(*) FROM rides WHERE status = 'scheduled'
UNION ALL
SELECT 'Viagens Ativas', COUNT(*) FROM rides WHERE status = 'active'
UNION ALL
SELECT 'Viagens Completadas', COUNT(*) FROM rides WHERE status = 'completed'
UNION ALL
SELECT 'Reservas Confirmadas', COUNT(*) FROM bookings WHERE status = 'confirmed'
UNION ALL
SELECT 'Reservas Pendentes', COUNT(*) FROM bookings WHERE status = 'pending'
UNION ALL
SELECT 'Avaliações', COUNT(*) FROM reviews
UNION ALL
SELECT 'Alertas', COUNT(*) FROM ride_alerts
UNION ALL
SELECT 'Notificações', COUNT(*) FROM notifications
ORDER BY estatistica;

-- =====================================================
-- LOGIN DE TESTE
-- =====================================================
-- Admin: admin@boleia.ao / password123
-- Passageiro: passenger1@boleia.ao / password123
-- Motorista: driver1@boleia.ao / password123
-- =====================================================