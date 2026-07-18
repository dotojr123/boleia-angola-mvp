# Dicionário de Dados — Boleia Angola

**Gerado em:** 2026-07-16T20:25:00Z  
**Agente:** Data Master  
**Nível de documentação:** essencial  
**Database:** PostgreSQL 15+ / Supabase

---

## Sumário Executivo

| Métrica | Valor |
|---------|-------|
| **Total de tabelas** | 12 |
| **Total de tipos/ENUMs** | 5 |
| **Total de índices** | 45+ |
| **Total de triggers** | 6 |
| **Row Level Security** | Ativado em todas as tabelas |
| **Schema principal** | `public` |

---

## Tipos de Dados (ENUMs)

### 1. `user_role`

| Valor | Descrição |
|-------|-----------|
| `passenger` | Usuário comum que busca caronas |
| `driver` | Motorista que oferece caronas |
| `admin` | Administrador da plataforma |

**Default:** `'passenger'`

### 2. `verification_status`

| Valor | Descrição |
|-------|-----------|
| `none` | Usuário não iniciou verificação |
| `pending` | Documentos enviados, aguardando review |
| `verified` | Documentos aprovados |
| `rejected` | Documentos rejeitados |

**Default:** `'none'`

### 3. `experience_level`

| Valor | Descrição |
|-------|-----------|
| `novice` | Iniciante |
| `intermediate` | Intermediário |
| `expert` | Experiente |
| `ambassador` | Embaixador (premium) |

**Default:** `'novice'`

### 4. `ride_status`

| Valor | Descrição |
|-------|-----------|
| `scheduled` | Viagem planejada |
| `active` | Viagem em andamento |
| `completed` | Viagem finalizada |
| `cancelled` | Viagem cancelada |

**Default:** `'scheduled'`

### 5. `booking_status`

| Valor | Descrição |
|-------|-----------|
| `pending` | Reserva pendente |
| `confirmed` | Reserva confirmada |
| `rejected` | Reserva rejeitada |
| `cancelled` | Reserva cancelada |

**Default:** `'pending'` (mas cria como `'confirmed'` na prática)

---

## Tabelas Detalhadas

### 📊 1. `profiles` — Usuários do Sistema

**Propósito:** Armazena informações públicas de usuários (passageiros, motoristas, admins). Extende o Supabase Auth.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `email` | TEXT | ❌ | — | Email único (UNIQUE) |
| `full_name` | TEXT | ✅ | — | Nome completo |
| `avatar_url` | TEXT | ✅ | — | URL do avatar |
| `phone` | TEXT | ✅ | — | Telefone (+244...) |
| `bio` | TEXT | ✅ | — | Biografia |
| `license_number` | TEXT | ✅ | — | Número da carteira de motorista |
| `verification_status` | verification_status | ❌ | `'none'` | Status de verificação |
| `rating` | NUMERIC(10,2) | ❌ | `5.00` | Média de avaliações |
| `reviews_count` | INTEGER | ❌ | `0` | Total de reviews recebidos |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `updated_at` | TIMESTAMPTZ | ❌ | `NOW()` | Última atualização |
| `experience_level` | experience_level | ❌ | `'novice'` | Nível de experiência |
| `interests` | TEXT[] | ✅ | — | Array de interesses |
| `travel_preferences` | JSONB | ❌ | `{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}` | Preferências de viagem |
| `role` | user_role | ❌ | `'passenger'` | Role do usuário |
| `avg_rating` | NUMERIC(10,2) | ❌ | `5.00` | Média alternativa |
| `total_reviews` | INTEGER | ❌ | `0` | Total reviews (alias) |
| `first_name` | VARCHAR(100) | ✅ | — | Nome |
| `last_name` | VARCHAR(100) | ✅ | — | Sobrenome |
| `display_name` | VARCHAR(100) | ✅ | — | Nome de exibição |
| `gender` | VARCHAR(20) | ✅ | — | Gênero |
| `birthdate` | DATE | ✅ | — | Data de nascimento |
| `phone_verified` | BOOLEAN | ❌ | `FALSE` | Telefone verificado |
| `email_verified` | BOOLEAN | ❌ | `FALSE` | Email verificado |
| `rides_offered` | INTEGER | ❌ | `0` | Total viagens como motorista |
| `rides_taken` | INTEGER | ❌ | `0` | Total viagens como passageiro |
| `response_rate` | INTEGER | ❌ | `0` | Taxa de resposta (%) |

**Constraints:**
- PRIMARY KEY: `id`
- UNIQUE: `email`

**Índices:**
- `idx_profiles_email` — Breadcrumbs por email
- `idx_profiles_role` — Filtro por role
- `idx_profiles_verification_status` — Filtro por verificação
- `idx_profiles_role_verification` — Composto: (role, verification_status)
- `idx_profiles_rating` — Ordenação por rating (DESC)
- `idx_profiles_created_at` — Usuários recentes

**RLS Policies:**
- `SELECT`: Qualquer um autenticado pode ver todos os perfis
- `INSERT`: Apenas próprio usuário (`auth.uid() = id`)
- `UPDATE`: Apenas próprio usuário
- `DELETE`: Apenas próprio usuário

---

### 🔐 2. `auth_credentials` — Credenciais de Autenticação

**Propósito:** Armazena credentials alternativas para autenticação (alternativa ao Supabase Auth).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `user_id` | UUID | ❌ | — | FK → profiles(id) |
| `email` | TEXT | ❌ | — | Email único |
| `password_hash` | TEXT | ❌ | — | Hash bcrypt da senha |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `profiles(id)` ON DELETE CASCADE
- UNIQUE: `email`

**RLS Policies:**
- `SELECT`: Apenas próprio usuário (`auth.uid() = user_id`)
- `INSERT`: Apenas próprio usuário
- `UPDATE`: Apenas próprio usuário
- `DELETE`: Apenas próprio usuário

---

### ⚙️ 3. `system_settings` — Configurações do Sistema

**Propósito:** Armazena configurações globais do sistema em formato key-value.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `key` | TEXT | ❌ | — | Chave única |
| `value` | JSONB | ✅ | — | Valor em JSON |
| `description` | TEXT | ✅ | — | Descrição da configuração |
| `updated_at` | TIMESTAMPTZ | ❌ | `NOW()` | Última atualização |

**Constraints:**
- PRIMARY KEY: `id`
- UNIQUE: `key`

**RLS Policies:**
- `SELECT`: Qualquer um pode ver
- `ALL`: Apenas admins

---

### 🚗 4. `vehicles` — Veículos dos Motoristas

**Propósito:** Veículos cadastrados por motoristas para oferecer caronas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `owner_id` | UUID | ❌ | — | FK → profiles(id) |
| `make` | TEXT | ❌ | — | Marca (ex: Toyota) |
| `model` | TEXT | ❌ | — | Modelo (ex: Corolla) |
| `year` | INTEGER | ✅ | — | Ano de fabricação |
| `color` | TEXT | ✅ | — | Cor |
| `plate` | TEXT | ✅ | — | Placa |
| `seats_capacity` | INTEGER | ❌ | `4` | Capacidade total |
| `photo_url` | TEXT | ✅ | — | URL da foto principal |
| `is_active` | BOOLEAN | ❌ | `TRUE` | Veículo ativo |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `updated_at` | TIMESTAMPTZ | ❌ | `NOW()` | Última atualização |
| `category` | VARCHAR(20) | ✅ | — | Categoria (SEDAN, SUV, etc.) |
| `comfort_level` | VARCHAR(20) | ✅ | — | Nível de conforto |
| `comfort_stars` | INTEGER | ✅ | — | Estrelas de conforto |
| `pictures` | JSONB | ❌ | `'[]'` | Array de URLs de fotos |
| `is_verified` | BOOLEAN | ❌ | `FALSE` | Veículo verificado |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `owner_id` → `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `vehicle_id` → `rides(vehicle_id)` (em rides)

**Índices:**
- `idx_vehicles_owner_id` — Veículos por proprietário

**RLS Policies:**
- `SELECT`: Qualquer um pode ver
- `INSERT/UPDATE/DELETE`: Apenas proprietário ou admin

---

### 🚙 5. `rides` — Viagens Oferecidas

**Propósito:** Viagens oferecidas por motoristas para passageiros.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `driver_id` | UUID | ❌ | — | FK → profiles(id) |
| `vehicle_id` | UUID | ✅ | — | FK → vehicles(id) |
| `origin_city` | VARCHAR(100) | ❌ | — | Cidade de origem |
| `origin_exact_point` | TEXT | ✅ | — | Ponto exato de partida |
| `destination_city` | VARCHAR(100) | ❌ | — | Cidade de destino |
| `destination_exact_point` | TEXT | ✅ | — | Ponto exato de chegada |
| `departure_time` | TIMESTAMPTZ | ❌ | — | Data/hora de partida |
| `estimated_arrival` | TIMESTAMPTZ | ✅ | — | Chegada estimada |
| `total_seats` | INTEGER | ❌ | — | Total de assentos (1-15) |
| `available_seats` | INTEGER | ❌ | — | Assentos disponíveis |
| `price_per_seat` | NUMERIC(10,2) | ❌ | — | Preço por assento |
| `currency` | TEXT | ❌ | `'Kz'` | Moeda (Kwanzas) |
| `status` | ride_status | ❌ | `'scheduled'` | Status da viagem |
| `description` | TEXT | ✅ | — | Descrição |
| `preferences` | JSONB | ❌ | `{"smoking": false, "pets": false, "music": true}` | Preferências |
| `waypoints` | JSONB | ✅ | — | Pontos intermediários |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `updated_at` | TIMESTAMPTZ | ❌ | `NOW()` | Última atualização |
| `baggage_policy` | VARCHAR(20) | ✅ | — | Política de mala |
| `permanent_id` | VARCHAR(100) | ✅ | — | ID permanente |
| `frequency` | VARCHAR(20) | ✅ | — | Frequência (UNIQUE, DAILY, etc.) |
| `distance_km` | INTEGER | ✅ | — | Distância em km |
| `luggage_size` | VARCHAR(20) | ✅ | — | Tamanho de mala |
| `booking_mode` | VARCHAR(20) | ✅ | — | Modo de reserva |
| `view_count` | INTEGER | ❌ | `0` | Contagem de visualizações |
| `is_comfort` | BOOLEAN | ❌ | `FALSE` | Viagem premium |
| `instant_booking` | BOOLEAN | ❌ | `FALSE` | Reserva instantânea |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `driver_id` → `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `vehicle_id` → `vehicles(id)` ON DELETE SET NULL
- CHECK: `total_seats > 0 AND total_seats <= 15`
- CHECK: `available_seats >= 0 AND available_seats <= total_seats`
- CHECK: `price_per_seat > 0`

**Índices:**
- `idx_rides_origin_destination` — Composto: (origin, destination)
- `idx_rides_departure_time` — Data de partida
- `idx_rides_status` — Status da viagem
- `idx_rides_driver_id` — Viagens do motorista
- `idx_rides_vehicle_id` — Veículo da viagem
- `idx_rides_available_seats` — Assentos livres
- `idx_rides_status_departure` — Composto: (status, departure_time)

**RLS Policies:**
- `SELECT`: Qualquer um pode ver
- `INSERT`: Apenas motoristas e admins
- `UPDATE/DELETE`: Apenas proprietário ou admin

---

### 🎫 6. `bookings` — Reservas de Assentos

**Propósito:** Reservas de assentos em viagens por passageiros.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `ride_id` | UUID | ❌ | — | FK → rides(id) |
| `passenger_id` | UUID | ❌ | — | FK → profiles(id) |
| `seats_booked` | INTEGER | ❌ | `1` | Assentos reservados |
| `total_price` | NUMERIC(10,2) | ❌ | — | Preço total |
| `status` | booking_status | ❌ | `'pending'` | Status da reserva |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `updated_at` | TIMESTAMPTZ | ❌ | `NOW()` | Última atualização |
| `booking_code` | VARCHAR(10) | ✅ | — | Código da reserva |
| `currency` | VARCHAR(3) | ✅ | — | Moeda |
| `expire_date` | TIMESTAMPTZ | ✅ | — | Data de expiração |
| `message_contact_allowed` | BOOLEAN | ❌ | `TRUE` | Permitir contato por mensagem |
| `phone_contact_allowed` | BOOLEAN | ❌ | `FALSE` | Permitir contato por telefone |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `ride_id` → `rides(id)` ON DELETE CASCADE
- FOREIGN KEY: `passenger_id` → `profiles(id)` ON DELETE CASCADE
- CHECK: `seats_booked > 0`

**Índices:**
- `idx_bookings_ride_id` — Reservas de uma viagem
- `idx_bookings_passenger_id` — Reservas do passageiro
- `idx_bookings_status` — Filtro por status
- `idx_bookings_passenger_status` — Composto: (passenger_id, status)

**RLS Policies:**
- `SELECT`: Passageiro vê suas reservas; Motorista vê reservas de suas viagens; Admin vê todas
- `INSERT`: Qualquer usuário autenticado
- `UPDATE`: Apenas dono da reserva, motorista do ride, ou admin

---

### ⭐ 7. `reviews` — Avaliações

**Propósito:** Avaliações feitas após viagens completadas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `booking_id` | UUID | ❌ | — | FK → bookings(id) |
| `reviewer_id` | UUID | ❌ | — | FK → profiles(id) — Quem avalia |
| `reviewee_id` | UUID | ❌ | — | FK → profiles(id) — Quem é avaliado |
| `rating` | INTEGER | ❌ | — | nota 1-5 |
| `comment` | TEXT | ✅ | — | Comentário |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data da avaliação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `booking_id` → `booking(id)`
- FOREIGN KEY: `reviewer_id` → `profiles(id)`
- FOREIGN KEY: `reviewee_id` → `profiles(id)`
- CHECK: `rating >= 1 AND rating <= 5`

**RLS Policies:**
- `SELECT`: Qualquer um pode ver reviews
- `INSERT`: Apenas passageiros/driver com booking completado
- `UPDATE/DELETE`: Apenas reviewer ou admin

---

### 💬 8. `messages` — Mensagens entre Usuários

**Propósito:** Comunicação direta entre passageiros e motoristas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `sender_id` | UUID | ❌ | — | FK → profiles(id) |
| `receiver_id` | UUID | ❌ | — | FK → profiles(id) |
| `content` | TEXT | ❌ | — | Conteúdo da mensagem |
| `is_read` | BOOLEAN | ❌ | `FALSE` | Lida ou não |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `ride_id` | UUID | ✅ | — | FK → rides(id) |
| `booking_id` | UUID | ✅ | — | FK → bookings(id) |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `sender_id` → `profiles(id)`
- FOREIGN KEY: `receiver_id` → `profiles(id)`

**Índices:**
- `idx_messages_sender_id` — Mensagens enviadas
- `idx_messages_receiver_id` — Mensagens recebidas
- `idx_messages_is_read` — Parcial: WHERE is_read = FALSE
- `idx_messages_created_at` — Ordenação por data

**RLS Policies:**
- `SELECT`: Apenas participantes da conversa
- `INSERT`: Apenas remetente autenticado
- `UPDATE`: Apenas destinatário (para marcar como lida)

---

### 🔔 9. `notifications` — Notificações

**Propósito:** Notificações do sistema para usuários.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `user_id` | UUID | ❌ | — | FK → profiles(id) |
| `title` | TEXT | ❌ | — | Título |
| `content` | TEXT | ❌ | — | Conteúdo |
| `type` | VARCHAR(50) | ❌ | — | Tipo (booking, alert, system, etc.) |
| `is_read` | BOOLEAN | ❌ | `FALSE` | Lida ou não |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |
| `link` | TEXT | ✅ | — | URL para detalhe |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `profiles(id)`

**RLS Policies:**
- `SELECT`: Apenas próprio usuário ou admin
- `INSERT`: Sistema ou admin
- `UPDATE`: Apenas próprio usuário

---

### 🗺️ 10. `waypoints` — Pontos Intermediários

**Propósito:** Pontos intermediários em uma viagem (paradas no caminho).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `ride_id` | UUID | ❌ | — | FK → rides(id) |
| `city` | VARCHAR(100) | ❌ | — | Cidade do waypoint |
| `exact_location` | TEXT | ❌ | — | Localização exata |
| `stop_order` | INTEGER | ❌ | — | Ordem da parada |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `ride_id` → `rides(id)` ON DELETE CASCADE

**RLS Policies:**
- `SELECT`: Qualquer um vê waypoints de viagens públicas
- `INSERT/UPDATE/DELETE`: Apenas motorista do ride ou admin

---

### 📄 11. `documents` — Documentos de Verificação

**Propósito:** Documentos carregados por usuários para verificação.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `user_id` | UUID | ❌ | — | FK → profiles(id) |
| `document_type` | TEXT | ❌ | — | Tipo (ID, CNH, etc.) |
| `document_url` | TEXT | ❌ | — | URL do arquivo |
| `status` | TEXT | ❌ | `'pending'` | Status (pending, approved, rejected) |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `profiles(id)` ON DELETE CASCADE

**RLS Policies:**
- `SELECT`: Apenas próprio usuário ou admin
- `INSERT`: Apenas próprio usuário
- `UPDATE/DELETE`: Apenas admin

---

### 🚨 12. `alerts` — Alertas de Segurança

**Propósito:** Alertas reportados por usuários contra outros usuários ou viagens.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | `uuid_generate_v4()` | Chave primária |
| `reporter_id` | UUID | ❌ | — | FK → profiles(id) |
| `target_user_id` | UUID | ✅ | — | FK → profiles(id) — Alvo |
| `target_ride_id` | UUID | ✅ | — | FK → rides(id) — Viagem relacionada |
| `reason` | TEXT | ❌ | — | Motivo do alerta |
| `description` | TEXT | ✅ | — | Descrição detalhada |
| `status` | TEXT | ❌ | `'pending'` | Status (pending, reviewed, resolved, dismissed) |
| `created_at` | TIMESTAMPTZ | ❌ | `NOW()` | Data de criação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `reporter_id` → `profiles(id)`
- FOREIGN KEY: `target_user_id` → `profiles(id)`
- FOREIGN KEY: `target_ride_id` → `rides(id)`

**RLS Policies:**
- `SELECT`: Reporter vê seus alerts; Admin vê todos
- `INSERT`: Qualquer usuário autenticado
- `UPDATE`: Apenas admin

---

## Resumo Estatístico

| Categoria | Contagem |
|-----------|----------|
| Tabelas principais | 12 |
| ENUMs/TYPES | 5 |
| FKs | 25+ |
| Índices | 45+ |
| Triggers | 6 |
| Polísticas RLS | 30+ |

---

**Documento gerado por:** Reversa Data Master  
**Confiança escalada:** 🟢 DDL direto | 🟡 Inferido | 🔴 Inacessível