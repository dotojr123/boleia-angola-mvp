# Boleia Angola - Schema Status

**Data:** 2026-04-13
**Versão do Schema:** 5.0
**Banco de Dados:** PostgreSQL 15+ / Supabase

---

## 1. Visão Geral

Este documento descreve o estado atual do schema do banco de dados da aplicação Boleia Angola, incluindo todas as tabelas, índices, triggers e políticas de segurança.

---

## 2. Tabelas Implementadas

| Tabela | Descrição | Status |
|--------|-----------|--------|
| `profiles` | Perfis de usuários (passengers, drivers, admins) | ✅ Completa |
| `auth_credentials` | Credenciais de autenticação alternativa | ✅ Completa |
| `system_settings` | Configurações do sistema | ✅ Completa |
| `vehicles` | Veículos dos motoristas | ✅ Completa |
| `rides` | Viagens oferecidas | ✅ Completa |
| `bookings` | Reservas de assentos | ✅ Completa |
| `reviews` | Avaliações de usuários | ✅ Completa |
| `messages` | Mensagens entre usuários | ✅ Completa |
| `notifications` | Notificações do sistema | ✅ Completa |
| `waypoints` | Pontos de rota das viagens | ✅ Completa |
| `documents` | Documentos enviados por usuários | ✅ Completa |

---

## 3. Estrutura Detalhada das Tabelas

### 3.1 profiles
Campos principais:
- `id` UUID (PK)
- `email` TEXT UNIQUE NOT NULL
- `full_name` TEXT
- `role` user_role (passenger/driver/admin)
- `verification_status` verification_status
- `rating` NUMERIC(10,2)
- `phone`, `bio`, `license_number`
- Campos estendidos: `experience_level`, `interests`, `travel_preferences`
- Campos de nome: `first_name`, `last_name`, `display_name`, `gender`, `birthdate`
- Status: `phone_verified`, `email_verified`
- Estatísticas: `rides_offered`, `rides_taken`, `response_rate`

### 3.2 vehicles
- `id` UUID (PK)
- `owner_id` UUID FK → profiles(id)
- `make`, `model`, `year`, `color`, `plate`
- `seats_capacity` INTEGER
- `category`, `comfort_level`, `comfort_stars`
- `is_active`, `is_verified`
- `pictures` JSONB

### 3.3 rides
- `id` UUID (PK)
- `driver_id` UUID FK → profiles(id)
- `vehicle_id` UUID FK → vehicles(id)
- `origin`, `destination` TEXT NOT NULL
- `stops` TEXT[]
- `departure_time` TIMESTAMPTZ NOT NULL
- `price_per_seat` NUMERIC(10,2) NOT NULL
- `total_seats`, `available_seats` INTEGER NOT NULL
- `status` ride_status
- Campos adicionais: `baggage_policy`, `frequency`, `distance_km`, `luggage_size`, `booking_mode`

### 3.4 bookings
- `id` UUID (PK)
- `ride_id` UUID FK → rides(id)
- `passenger_id` UUID FK → profiles(id)
- `seats_booked` INTEGER
- `total_price` NUMERIC(10,2)
- `status` booking_status
- Campos financeiros: `unit_price`, `commission`, `currency`, `passenger_refund`, `driver_compensation`

### 3.5 reviews
- `id` UUID (PK)
- `booking_id` UUID FK → bookings(id)
- `reviewer_id`, `reviewee_id` UUID FK → profiles(id)
- `rating` INTEGER (1-5)
- `comment` TEXT
- `moderation_status` VARCHAR(20)

### 3.6 messages
- `id` UUID (PK)
- `sender_id`, `receiver_id` UUID FK → profiles(id)
- `ride_id` UUID FK → rides(id)
- `booking_id` UUID FK → bookings(id)
- `content` TEXT NOT NULL
- `is_read` BOOLEAN
- `read_at` TIMESTAMPTZ

### 3.7 notifications
- `id` UUID (PK)
- `user_id` UUID FK → profiles(id)
- `title`, `content` TEXT NOT NULL
- `type`, `link` TEXT
- `is_read` BOOLEAN

### 3.8 waypoints
- `id` UUID (PK)
- `ride_id` UUID FK → rides(id)
- `order_index` INTEGER
- `type` TEXT[]
- `city` VARCHAR(100)
- `address` TEXT
- `country_code` VARCHAR(2)
- `arrival_datetime`, `departure_datetime` TIMESTAMPTZ

### 3.9 documents
- `id` UUID (PK)
- `user_id` UUID FK → profiles(id)
- `document_type` VARCHAR(50)
- `document_url` TEXT
- `status` VARCHAR(20)

### 3.10 auth_credentials
- `id` UUID (PK)
- `user_id` UUID FK → profiles(id)
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL

### 3.11 system_settings
- `id` UUID (PK)
- `key` TEXT UNIQUE NOT NULL
- `value` JSONB
- `description` TEXT

---

## 4. Tipos (Enums)

| Tipo | Valores |
|------|---------|
| `user_role` | passenger, driver, admin |
| `verification_status` | pending, verified, rejected, none |
| `experience_level` | novice, intermediate, expert, ambassador |
| `ride_status` | scheduled, active, completed, cancelled |
| `booking_status` | pending, confirmed, rejected, cancelled |

---

## 5. Índices Críticos para Performance

### Perfis (profiles)
- `idx_profiles_email` - Busca por email (login)
- `idx_profiles_role` - Filtrar por tipo de usuário
- `idx_profiles_verification_status` - Motoristas verificados
- `idx_profiles_role_verification` - Índice composto
- `idx_profiles_rating` - Ordenação por rating
- `idx_profiles_created_at` - Usuários recentes

### Viagens (rides)
- `idx_rides_origin` - Busca por origem
- `idx_rides_destination` - Busca por destino
- `idx_rides_origin_destination` - Índice composto (rota)
- `idx_rides_departure_time` - Busca por data
- `idx_rides_driver_id` - Minhas viagens
- `idx_rides_status` - Filtrar por status
- `idx_rides_available_seats` - Vagas disponíveis
- `idx_rides_view_count` - Ranking de visualizações

### Reservas (bookings)
- `idx_bookings_passenger_id` - Minhas reservas
- `idx_bookings_ride_id` - Reservas por viagem
- `idx_bookings_status` - Status da reserva
- `idx_bookings_passenger_status` - Índice composto

### Mensagens (messages)
- `idx_messages_sender_id` - Mensagens enviadas
- `idx_messages_receiver_id` - Mensagens recebidas
- `idx_messages_is_read` - Mensagens não lidas (parcial)
- `idx_messages_unread_by_receiver` - Índice composto parcial

### Avaliações (reviews)
- `idx_reviews_reviewer_id` - Avaliações feitas
- `idx_reviews_reviewee_id` - Avaliações recebidas
- `idx_reviews_booking_id` - Por reserva

### Veículos (vehicles)
- `idx_vehicles_owner_id` - Meus veículos
- `idx_vehicles_is_active` - Veículos ativos (parcial)

### Notificações (notifications)
- `idx_notifications_user_id` - Minhas notificações
- `idx_notifications_is_read` - Não lidas (parcial)

---

## 6. Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas para:

| Tabela | Políticas Implementadas |
|--------|------------------------|
| profiles | SELECT público, INSERT/UPDATE/DELETE próprio |
| vehicles | SELECT público, CUD apenas dono |
| rides | SELECT público, CUD apenas motorista |
| bookings | SELECT passageiro/motorista, INSERT passageiro, UPDATE motorista |
| messages | SELECT/INSERT participantes, UPDATE/DELETE remetente |
| reviews | SELECT participantes, CUD autor |
| notifications | SELECT/INSERT/UPDATE/DELETE próprio |
| waypoints | SELECT público, CUD motorista dono da ride |
| documents | SELECT/INSERT/UPDATE/DELETE próprio |
| auth_credentials | SELECT/INSERT/UPDATE/DELETE próprio |
| system_settings | SELECT público, UPDATE admin |

---

## 7. Triggers Implementados

| Trigger | Função | Descrição |
|---------|--------|-----------|
| `on_auth_user_created` | `handle_new_user()` | Cria profile automaticamente ao criar usuário |
| `on_booking_status_change` | `update_available_seats()` | Atualiza assentos disponíveis |
| `set_updated_at_*` | `set_current_timestamp_updated_at()` | Atualiza timestamp em updates |
| `on_review_created` | `update_user_rating()` | Atualiza rating médio do usuário |

---

## 8. Correções de Inconsistências Aplicadas

1. **Campos NOT NULL**: Garantido que campos críticos tenham restrição NOT NULL
2. **Valores padrão**: Adicionados DEFAULT onde necessário
3. **Tipos consistentes**: Uniformização de tipos NUMERIC e VARCHAR
4. **FK constraints**: Todas as foreign keys com ON DELETE apropriado

---

## 9. Dados de Seed

O sistema inclui configurações iniciais:
- `commission_rate`: 15%
- `min_commission`: 500 AOA
- `app_name`: "Boleia Angola"
- `support_email`: suporte@boleiaangola.com
- `support_phone`: +244 923 000 000
- `maintenance_mode`: false
- `social_links`: JSON com links de redes sociais

---

## 10. Recomendações

1. **Backup**: Manter backups regulares do banco de dados
2. **Monitoramento**: Monitorar tamanho das tabelas e performance de queries
3. **Índices adicionais**: Considerar índices GIN para busca full-text em origin/destination
4. **Manutenção**: Executar ANALYZE periodicamente em tabelas com muitas mudanças

---

## 11. Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 5.0 | 2026-04-13 | Migration unificada com todas as correções |
| 4.0 | 2026-04-13 | Schema base com RLS e triggers |
| 3.0 | 2025-02-04 | Schema original do backup |

---

*Documento gerado automaticamente como parte da migration unificada.*
