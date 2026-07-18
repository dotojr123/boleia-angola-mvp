-- ============================================================================
-- Boleia Angola - Índices de Performance
-- PostgreSQL 17.7 + Supabase
-- Data: 2026-04-13
-- ============================================================================
-- Este arquivo contém índices para otimizar as queries mais comuns do sistema.
-- Os índices são organizados por tabela e por tipo de busca.
-- ============================================================================

-- ============================================================================
-- 1. PERFIL (profiles)
-- ============================================================================

-- Índice para busca por email (login, autenticação)
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

-- Índice para busca por role (filtrar motoristas, passageiros, admins)
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

-- Índice para status de verificação (filtros de motoristas verificados)
DROP INDEX IF EXISTS idx_profiles_verification_status;
CREATE INDEX idx_profiles_verification_status ON public.profiles USING btree (verification_status);

-- Índice composto para listagem de motoristas verificados
DROP INDEX IF EXISTS idx_profiles_role_verification;
CREATE INDEX idx_profiles_role_verification ON public.profiles USING btree (role, verification_status);

-- Índice para rating (ordenar por melhor classificados)
DROP INDEX IF EXISTS idx_profiles_rating;
CREATE INDEX idx_profiles_rating ON public.profiles USING btree (rating DESC);

-- Índice para data de criação (usuários recentes)
DROP INDEX IF EXISTS idx_profiles_created_at;
CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

-- ============================================================================
-- 2. VIAGENS (rides)
-- ============================================================================

-- Índice para busca por origem (queries de "saindo de X")
DROP INDEX IF EXISTS idx_rides_origin;
CREATE INDEX idx_rides_origin ON public.rides USING btree (origin);

-- Índice para busca por destino (queries "indo para Y")
DROP INDEX IF EXISTS idx_rides_destination;
CREATE INDEX idx_rides_destination ON public.rides USING btree (destination);

-- Índice composto origem-destino (buscas de rota)
DROP INDEX IF EXISTS idx_rides_origin_destination;
CREATE INDEX idx_rides_origin_destination ON public.rides USING btree (origin, destination);

-- Índice para data de partida (busca por data)
DROP INDEX IF EXISTS idx_rides_departure_time;
CREATE INDEX idx_rides_departure_time ON public.rides USING btree (departure_time);

-- Índice para busca por status
DROP INDEX IF EXISTS idx_rides_status;
CREATE INDEX idx_rides_status ON public.rides USING btree (status);

-- Índice para driver_id (minha lista de viagens)
DROP INDEX IF EXISTS idx_rides_driver_id;
CREATE INDEX idx_rides_driver_id ON public.rides USING btree (driver_id);

-- Índice para vehicle_id
DROP INDEX IF EXISTS idx_rides_vehicle_id;
CREATE INDEX idx_rides_vehicle_id ON public.rides USING btree (vehicle_id);

-- Índice para lugares disponíveis (busca rápida por vagas)
DROP INDEX IF EXISTS idx_rides_available_seats;
CREATE INDEX idx_rides_available_seats ON public.rides USING btree (available_seats);

-- Índice para ordenação por mais recente
DROP INDEX IF EXISTS idx_rides_created_at;
CREATE INDEX idx_rides_created_at ON public.rides USING btree (created_at DESC);

-- Índice para busca por frequency (rotas recorrentes)
DROP INDEX IF EXISTS idx_rides_frequency;
CREATE INDEX idx_rides_frequency ON public.rides USING btree (frequency);

-- Índice para view_count (ranking de visualizações)
DROP INDEX IF EXISTS idx_rides_view_count;
CREATE INDEX idx_rides_view_count ON public.rides USING btree (view_count DESC);

-- Índice composto para status + departure_time (viagens ativas ordenadas)
DROP INDEX IF EXISTS idx_rides_status_departure;
CREATE INDEX idx_rides_status_departure ON public.rides USING btree (status, departure_time);

-- ============================================================================
-- 3. RESERVAS (bookings)
-- ============================================================================

-- Índice para busca por passageiro (minhas reservas)
DROP INDEX IF EXISTS idx_bookings_passenger_id;
CREATE INDEX idx_bookings_passenger_id ON public.bookings USING btree (passenger_id);

-- Índice para busca por ride_id (reservas de uma viagem)
DROP INDEX IF EXISTS idx_bookings_ride_id;
CREATE INDEX idx_bookings_ride_id ON public.bookings USING btree (ride_id);

-- Índice para status da reserva (filtrar pendentes, confirmadas, etc.)
DROP INDEX IF EXISTS idx_bookings_status;
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

-- Índice para data de criação (reservas recentes)
DROP INDEX IF EXISTS idx_bookings_created_at;
CREATE INDEX idx_bookings_created_at ON public.bookings USING btree (created_at DESC);

-- Índice composto passageiro + status (minhas reservas por status)
DROP INDEX IF EXISTS idx_bookings_passenger_status;
CREATE INDEX idx_bookings_passenger_status ON public.bookings USING btree (passenger_id, status);

-- Índice para booking_code (busca por código)
DROP INDEX IF EXISTS idx_bookings_booking_code;
CREATE INDEX idx_bookings_booking_code ON public.bookings USING btree (booking_code);

-- Índice para expire_date (busca por expiração)
DROP INDEX IF EXISTS idx_bookings_expire_date;
CREATE INDEX idx_bookings_expire_date ON public.bookings USING btree (expire_date);

-- ============================================================================
-- 4. MENSAGENS (messages)
-- ============================================================================

-- Índice para sender_id (minhas mensagens enviadas)
DROP INDEX IF EXISTS idx_messages_sender_id;
CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);

-- Índice para receiver_id (minhas mensagens recebidas)
DROP INDEX IF EXISTS idx_messages_receiver_id;
CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);

-- Índice para is_read (mensagens não lidas)
DROP INDEX IF EXISTS idx_messages_is_read;
CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read) WHERE is_read = false;

-- Índice para created_at (ordenar por data)
DROP INDEX IF EXISTS idx_messages_created_at;
CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);

-- Índice para booking_id (mensagens por reserva)
DROP INDEX IF EXISTS idx_messages_booking_id;
CREATE INDEX idx_messages_booking_id ON public.messages USING btree (booking_id);

-- Índice para ride_id (mensagens por viagem)
DROP INDEX IF EXISTS idx_messages_ride_id;
CREATE INDEX idx_messages_ride_id ON public.messages USING btree (ride_id);

-- Índice composto para conversas (remetente + destinatário)
DROP INDEX IF EXISTS idx_messages_sender_receiver;
CREATE INDEX idx_messages_sender_receiver ON public.messages USING btree (sender_id, receiver_id);

-- Índice para read_at (mensagens lidas por data)
DROP INDEX IF EXISTS idx_messages_read_at;
CREATE INDEX idx_messages_read_at ON public.messages USING btree (read_at);

-- Índice para unread count (otimizar contagem de não lidas)
DROP INDEX IF EXISTS idx_messages_unread_by_receiver;
CREATE INDEX idx_messages_unread_by_receiver ON public.messages USING btree (receiver_id, created_at) WHERE is_read = false;

-- ============================================================================
-- 5. AVALIAÇÕES (reviews)
-- ============================================================================

-- Índice para booking_id (avaliações por reserva)
DROP INDEX IF EXISTS idx_reviews_booking_id;
CREATE INDEX idx_reviews_booking_id ON public.reviews USING btree (booking_id);

-- Índice para reviewer_id (avaliações feitas por usuário)
DROP INDEX IF EXISTS idx_reviews_reviewer_id;
CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);

-- Índice para reviewee_id (avaliações recebidas)
DROP INDEX IF EXISTS idx_reviews_reviewee_id;
CREATE INDEX idx_reviews_reviewee_id ON public.reviews USING btree (reviewee_id);

-- Índice para rating (cálculo de médias)
DROP INDEX IF EXISTS idx_reviews_rating;
CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);

-- Índice para created_at (avaliações recentes)
DROP INDEX IF EXISTS idx_reviews_created_at;
CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);

-- Índice para moderation_status
DROP INDEX IF EXISTS idx_reviews_moderation_status;
CREATE INDEX idx_reviews_moderation_status ON public.reviews USING btree (moderation_status);

-- ============================================================================
-- 6. VEÍCULOS (vehicles)
-- ============================================================================

-- Índice para owner_id (meus veículos)
DROP INDEX IF EXISTS idx_vehicles_owner_id;
CREATE INDEX idx_vehicles_owner_id ON public.vehicles USING btree (owner_id);

-- Índice para is_active (veículos ativos)
DROP INDEX IF EXISTS idx_vehicles_is_active;
CREATE INDEX idx_vehicles_is_active ON public.vehicles USING btree (is_active) WHERE is_active = true;

-- Índice para plate (busca por placa)
DROP INDEX IF EXISTS idx_vehicles_plate;
CREATE INDEX idx_vehicles_plate ON public.vehicles USING btree (plate);

-- Índice para created_at
DROP INDEX IF EXISTS idx_vehicles_created_at;
CREATE INDEX idx_vehicles_created_at ON public.vehicles USING btree (created_at);

-- ============================================================================
-- 7. NOTIFICAÇÕES (notifications)
-- ============================================================================

-- Índice para user_id (minhas notificações)
DROP INDEX IF EXISTS idx_notifications_user_id;
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

-- Índice para is_read (não lidas)
DROP INDEX IF EXISTS idx_notifications_is_read;
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read) WHERE is_read = false;

-- Índice para created_at (ordenar por data)
DROP INDEX IF EXISTS idx_notifications_created_at;
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

-- Índice composto user_id + is_read (minhas não lidas)
DROP INDEX IF EXISTS idx_notifications_user_unread;
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE is_read = false;

-- Índice para type (filtro por tipo)
DROP INDEX IF EXISTS idx_notifications_type;
CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);

-- ============================================================================
-- 8. WAYPOINTS
-- ============================================================================

-- Índice para ride_id (waypoints de uma viagem)
DROP INDEX IF EXISTS idx_waypoints_ride_id;
CREATE INDEX idx_waypoints_ride_id ON public.waypoints USING btree (ride_id);

-- Índice para order_index (ordenar por ordem)
DROP INDEX IF EXISTS idx_waypoints_order_index;
CREATE INDEX idx_waypoints_order_index ON public.waypoints USING btree (order_index);

-- Índice para city (busca por cidade)
DROP INDEX IF EXISTS idx_waypoints_city;
CREATE INDEX idx_waypoints_city ON public.waypoints USING btree (city);

-- Índice para country_code
DROP INDEX IF EXISTS idx_waypoints_country_code;
CREATE INDEX idx_waypoints_country_code ON public.waypoints USING btree (country_code);

-- ============================================================================
-- 9. AUTH_CREDENTIALS
-- ============================================================================

-- Índice para user_id
DROP INDEX IF EXISTS idx_auth_credentials_user_id;
CREATE INDEX idx_auth_credentials_user_id ON public.auth_credentials USING btree (user_id);

-- Índice para email (login)
DROP INDEX IF EXISTS idx_auth_credentials_email;
CREATE INDEX idx_auth_credentials_email ON public.auth_credentials USING btree (email);

-- ============================================================================
-- 10. SYSTEM_SETTINGS
-- ============================================================================

-- Índice para key (busca rápida)
DROP INDEX IF EXISTS idx_system_settings_key;
CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (key);

-- ============================================================================
-- 11. ÍNDICES ADICIONAIS PARA PERFORMANCE GERAL
-- ============================================================================

-- Índice para full text search em origem/destino (busca textual)
DROP INDEX IF EXISTS idx_rides_origin_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Se quiser habilitar busca fuzzy para origens/destinos:
-- CREATE INDEX idx_rides_origin_trgm ON public.rides USING gin (origin gin_trgm_ops);
-- CREATE INDEX idx_rides_destination_trgm ON public.rides USING gin (destination gin_trgm_ops);

-- ============================================================================
-- 12. ESTATÍSTICAS PARA O QUERY PLANNER
-- ============================================================================

-- Atualizar estatísticas para todas as tabelas
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

-- ============================================================================
-- RESUMO DOS ÍNDICES POR CASO DE USO
-- ============================================================================
--
-- Busca por origem/destino:
--   - idx_rides_origin
--   - idx_rides_destination
--   - idx_rides_origin_destination (composto)
--
-- Busca por data:
--   - idx_rides_departure_time
--   - idx_bookings_created_at
--   - idx_messages_created_at
--
-- Status de reservas:
--   - idx_bookings_status
--   - idx_bookings_passenger_status (composto)
--
-- Mensagens não lidas:
--   - idx_messages_is_read (parcial)
--   - idx_messages_unread_by_receiver (composto parcial)
--   - idx_notifications_is_read
--   - idx_notifications_user_unread (composto parcial)
--
-- ===========================================================================
-- Fim dos Índices de Performance
-- ============================================================================
