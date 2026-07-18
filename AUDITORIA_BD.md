# AUDITORIA DO BANCO DE DADOS - BOLEIA ANGOLA

## Resumo do Estado Atual

**Banco:** PostgreSQL 16.14 (Ubuntu) - Container `boleia-db` rodando na porta 5432
**Usuário:** `boleia_user` | **Database:** `boleia_angola`
**Tabelas existentes:** 12 tabelas

---

## 1. TABELAS EXISTENTES E COMPARATIVO

### ✅ profiles (29 colunas) - COMPLETA
Tem todos os campos principais + campos extras do BlaBlaCar:
- ✓ Identificação: id, email, full_name, avatar_url, phone, bio
- ✓ Motorista: license_number, verification_status, experience_level
- ✓ Reputação: rating, reviews_count, avg_rating, total_reviews
- ✓ Dados pessoais: first_name, last_name, display_name, gender, birthdate
- ✓ Verificação: phone_verified, email_verified, document_verified, verification_badge
- ✓ Estatísticas: rides_offered, rides_taken, response_rate
- ✓ Preferências: interests (text[]), travel_preferences (jsonb)
- ✓ Redes sociais: **FALTANDO** facebook_id, google_id, apple_id
- ✓ Endereço: **FALTANDO** address_line1, address_line2, city, state, postal_code, country
- ✓ Notificações: **FALTANDO** notify_email, notify_push, notify_sms
- ✓ Segurança: **FALTANDO** two_factor_enabled, two_factor_secret
- ✓ Timestamps extras: **FALTANDO** last_login_at, email_verified_at, phone_verified_at
- ✓ Localização: **FALTANDO** preferred_language, currency, timezone

---

### ✅ vehicles (17 colunas) - PARCIALMENTE COMPLETA
Tem campos básicos + alguns do BlaBlaCar:
- ✓ Básicos: id, owner_id, make, model, year, color, plate, seats_capacity, photo_url, is_active
- ✓ Especificações: category, comfort_level, comfort_stars, pictures (jsonb), is_verified, updated_at
- **FALTANDO** (do missing_columns.sql):
  - transmission, fuel_type, engine_size, horsepower
  - doors, luggage_capacity, features (jsonb)
  - registration_number, insurance_expiry, inspection_expiry
  - registration_doc_url, insurance_doc_url
  - total_trips, total_distance_km

---

### ✅ rides (38 colunas) - MUITO COMPLETA
Tem a maioria dos campos necessários:
- ✓ Básicos: id, driver_id, vehicle_id, origin, destination, stops (text[]), departure_time, estimated_duration
- ✓ Preço: price_per_seat, currency, total_seats, available_seats
- ✓ Status: status, description, preferences (jsonb)
- ✓ Recorrência: permanent_id, frequency, schedule_flexibility, booking_mode
- ✓ Bagagem: baggage_policy, luggage_size, detour_allowed
- ✓ Extras: price_with_commission, distance_km, view_count, is_comfort, cross_border_alert, instant_booking
- ✓ Waypoints: pickup_zone, dropoff_zone, waypoints (jsonb)
- ✓ Constraint: rides_max_15_seats (total_seats <= 15)
- **FALTANDO** (do missing_columns.sql):
  - driver_type (DRIVER/OWNER)
  - vehicle_type (SEDAN/SUV/VAN/etc)
  - comfort_class (ECONOMY/COMFORT/LUXURY)
  - cancellation_policy
  - luggage_allowance, luggage_price
  - smoking_allowed, pets_allowed, ac_available, wifi_available, phone_charging, child_seat_available
  - wheelchair_accessible
  - price_breakdown (jsonb), discount_percent
  - route_geometry, duration_minutes
  - recurrence_pattern, recurrence_end_date, parent_ride_id
  - is_public, is_featured
  - favorites_count, inquiries_count
  - published_at, completed_at, cancelled_at, cancelled_reason, cancelled_by

---

### ✅ bookings (19 colunas) - PARCIALMENTE COMPLETA
- ✓ Básicos: id, ride_id, passenger_id, seats_booked, total_price, status
- ✓ Código: booking_code, file_number
- ✓ Preço: unit_price, commission, currency, passenger_refund, driver_compensation
- ✓ Extras: expire_date, trip_is_passed, message_contact_allowed, phone_contact_allowed
- **FALTANDO** (do missing_columns.sql):
  - booking_reference
  - passenger_count, passenger_details (jsonb)
  - subtotal, tax_amount, discount_amount, service_fee
  - payment_status, payment_method, payment_id
  - cancellation_reason, cancelled_by_uuid, cancelled_at
  - confirmed_at, rejected_at, completed_at
  - last_message_at, message_count

---

### ✅ reviews (10 colunas) - PARCIALMENTE COMPLETA
- ✓ Básicos: id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at
- ✓ Contexto: role, trip_id, moderation_status
- **FALTANDO** (do missing_columns.sql):
  - review_type (RIDE/DRIVER/PASSENGER)
  - cleanliness_rating, communication_rating, punctuality_rating, comfort_rating, safety_rating
  - is_visible, is_response, response_text, response_created_at
  - helpful_count, reported_count

---

### ✅ messages (9 colunas) - PARCIALMENTE COMPLETA
- ✓ Básicos: id, sender_id, receiver_id, ride_id, content, is_read, created_at
- ✓ Referências: booking_id, read_at
- **FALTANDO** (do missing_columns.sql):
  - message_type (TEXT/IMAGE/SYSTEM)
  - status (SENT/DELIVERED/READ)
  - attachment_url, attachment_type, attachment_size
  - delivered_at, edited_at, deleted_at, is_deleted

---

### ✅ waypoints (11 colunas) - COMPLETA
Tem todos os campos necessários para paradas intermediárias.

---

### ✅ Tabelas NOVAS já existentes (não estavam no schema_production.sql original)
- ✅ ride_alerts - Alertas de viagem ("Criar Alertas")
- ✅ vehicle_photos - Fotos de veículos (referenciado no vehicles.js)
- ✅ notifications - Notificações do sistema
- ✅ system_settings - Configurações do sistema

---

## 2. TABELAS FALTANDO COMPLETAMENTE (do missing_columns.sql)

| Tabela | Descrição | Prioridade |
|--------|-----------|------------|
| booking_passengers | Passageiros múltiplos por reserva | ALTA |
| payment_transactions | Transações de pagamento | ALTA |
| user_documents | Documentos de verificação (CNH, RG, etc) | ALTA |
| ride_favorites | Favoritos de viagens | MÉDIA |
| ride_reports | Denúncias de viagens | MÉDIA |
| activity_logs | Logs de auditoria | BAIXA |

---

## 3. ÍNDICES FALTANDO

Baseado no `missing_columns.sql` e `migration_v2.sql`:

### profiles
- idx_profiles_email
- idx_profiles_role
- idx_profiles_verification_status
- idx_profiles_created_at

### rides
- idx_rides_driver_id
- idx_rides_status
- idx_rides_departure_time
- idx_rides_origin_destination
- idx_rides_created_at
- idx_rides_permanent_id
- idx_rides_frequency

### bookings
- idx_bookings_passenger_id
- idx_bookings_ride_id
- idx_bookings_status
- idx_bookings_created_at
- idx_bookings_code (booking_code)

### messages
- idx_messages_ride_id
- idx_messages_sender_id
- idx_messages_receiver_id
- idx_messages_created_at
- idx_messages_booking_id

### vehicles
- idx_vehicles_owner_id

### waypoints
- idx_waypoints_ride
- idx_waypoints_city

### reviews
- idx_reviews_trip
- idx_reviews_booking_id

### Novas tabelas
- Índices nas tabelas booking_passengers, payment_transactions, user_documents, ride_favorites, ride_reports, activity_logs

---

## 4. TRIGGERS E FUNÇÕES FALTANDO

Do `migration_v2.sql` e `audit_fixes.sql`:

1. **generate_booking_code()** - Trigger BEFORE INSERT em bookings ✅ (já existe no migration_v2)
2. **update_ride_stats()** - Trigger AFTER UPDATE em bookings ✅ (já existe)
3. **generate_ride_permanent_id()** - Trigger BEFORE INSERT em rides ✅ (já existe)
4. **update_updated_at_column()** - Trigger em vehicles, ride_alerts ✅ (parcial - tem em ride_alerts)
5. **update_available_seats()** - Do schema_production.sql para atualizar assentos ✅ (precisa verificar se existe)

**FALTANDO:**
- Triggers updated_at para: rides, bookings, profiles, vehicles, messages, reviews, waypoints

---

## 5. RLS (Row Level Security) - STATUS

**ATUAL:** Banco local (Docker) sem RLS habilitado
**NECESSÁRIO:** Habilitar RLS + policies para produção (Supabase)

Tabelas que precisam RLS:
- profiles, vehicles, rides, bookings, reviews, messages, waypoints, ride_alerts, vehicle_photos, notifications

---

## 6. ENUMS EXISTENTES

- user_role: passenger, driver, admin
- verification_status: pending, verified, rejected, none
- experience_level: novice, intermediate, expert, ambassador
- ride_status: scheduled, active, completed, cancelled
- booking_status: pending, confirmed, rejected, cancelled

**FALTANDO** (do migration_v2.sql):
- comfort_level, luggage_size, detour_allowed, frequency, booking_mode como ENUMs (hoje são VARCHAR com CHECK)

---

## 7. PLANO DE AÇÃO RECOMENDADO

### FASE 1 - Crítico (Dados & Pagamentos)
1. Criar tabela `payment_transactions`
2. Adicionar colunas de pagamento em `bookings` (payment_status, payment_method, payment_id)
3. Criar tabela `booking_passengers` para múltiplos passageiros
4. Criar tabela `user_documents` para verificação de motoristas

### FASE 2 - Funcionalidades BlaBlaCar
1. Adicionar colunas faltando em `vehicles` (transmission, fuel_type, docs, stats)
2. Adicionar colunas faltando em `rides` (comfort_class, amenities, recurrence, etc)
3. Adicionar colunas detalhadas em `reviews` (critérios específicos)
4. Adicionar colunas em `messages` (attachments, status)
5. Criar tabelas `ride_favorites`, `ride_reports`

### FASE 3 - Performance & Auditoria
1. Criar todos os índices faltantes
2. Adicionar triggers updated_at em todas as tabelas
3. Criar tabela `activity_logs`
4. Habilitar RLS + policies (produção)

### FASE 4 - Perfil Completo
1. Adicionar endereço, redes sociais, 2FA, notificações em `profiles`
2. Converter VARCHARs com CHECK para ENUMs onde apropriado

---

## 8. COMANDOS PARA EXECUTAR A AUDITORIA NO BANCO

```bash
# Conectar no banco
psql -h localhost -p 5432 -U boleia_user -d boleia_angola

# Ver estrutura completa
\d profiles
\d vehicles
\d rides
\d bookings
\d reviews
\d messages
\d waypoints

# Ver triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

# Ver índices
SELECT * FROM pg_indexes WHERE schemaname = 'public';

# Ver constraints
SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
```

---

## 9. ARQUIVOS DE MIGRAÇÃO DISPONÍVEIS

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `full_migration_v3.sql` | Backup completo do Supabase (base) | ✅ Aplicado |
| `migration_v2.sql` | Migração v2 com triggers, waypoints, RLS | 📋 Referência |
| `missing_columns.sql` | **TODAS** colunas faltando estilo BlaBlaCar | 📋 Plano |
| `audit_fixes.sql` | Correções de auditoria (ride_alerts, vehicle_photos) | ✅ Parcial |
| `init_fixed.sql` | Versão corrigida do init (sem erro postgres role) | ✅ Usado |

---

**Conclusão:** O banco tem uma base sólida (schema v3 aplicado), mas faltam ~80+ colunas e 6 tabelas para atingir paridade completa com modelo BlaBlaCar. Recomenda-se aplicar `missing_columns.sql` em etapas.