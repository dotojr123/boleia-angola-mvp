# ERD Completo — Boleia Angola

**Gerado em:** 2026-07-16T20:25:00Z  
**Agente:** Data Master  
**Database:** PostgreSQL 15+ / Supabase

---

## Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    profiles ||--o{ vehicles : "owns"
    profiles ||--o{ rides : "drives"
    profiles ||--o{ bookings : "makes"
    profiles ||--o{ messages : "sends"
    profiles ||--o{ messages : "receives"
    profiles ||--o{ reviews : "writes"
    profiles ||--o{ reviews : "receives"
    profiles ||--o{ alerts : "reports"
    profiles ||--o| auth_credentials : "uses"
    profiles ||--o{ documents : "uploads"
    profiles ||--o{ notifications : "receives"
    
    vehicles ||--o{ rides : "used in"
    
    rides ||--o{ bookings : "has"
    rides ||--o{ messages : "related to"
    rides ||--o{ reviews : "generates"
    rides ||--o{ alerts : "targeted in"
    rides ||--o{ waypoints : "includes"
    
    bookings ||--o{ reviews : "generates"
    bookings ||--o{ messages : "related to"
    
    %% User roles
    profiles {
        uuid id PK
        string email UK
        string full_name
        string phone
        user_role "passenger|driver|admin"
        verification_status "none|pending|verified|rejected"
        numeric rating
        timestamp created_at
    }
    
    %% Vehicles
    vehicles {
        uuid id PK
        uuid owner_id FK
        string make
        string model
        int seats_capacity
        boolean is_active
    }
    
    %% Rides
    rides {
        uuid id PK
        uuid driver_id FK
        uuid vehicle_id FK
        string origin_city
        string destination_city
        timestamp departure_time
        int total_seats
        int available_seats
        numeric price_per_seat
        ride_status "scheduled|active|completed|cancelled"
    }
    
    %% Bookings
    bookings {
        uuid id PK
        uuid ride_id FK
        uuid passenger_id FK
        int seats_booked
        numeric total_price
        booking_status "pending|confirmed|rejected|cancelled"
    }
    
    %% Messages
    messages {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        string content
        boolean is_read
    }
    
    %% Reviews
    reviews {
        uuid id PK
        uuid booking_id FK
        uuid reviewer_id FK
        uuid reviewee_id FK
        int "rating 1-5"
        string comment
    }
    
    %% Alerts
    alerts {
        uuid id PK
        uuid reporter_id FK
        uuid target_user_id FK
        uuid target_ride_id FK
        string reason
        string status "pending|reviewed|resolved|dismissed"
    }
    
    %% Notifications
    notifications {
        uuid id PK
        uuid user_id FK
        string title
        string content
        string type
        boolean is_read
    }
    
    %% Documents
    documents {
        uuid id PK
        uuid user_id FK
        string document_type
        string document_url
        string status
    }
    
    %% Waypoints
    waypoints {
        uuid id PK
        uuid ride_id FK
        string city
        string exact_location
        int stop_order
    }
    
    %% Auth credentials
    auth_credentials {
        uuid id PK
        uuid user_id FK
        string email UK
        string password_hash
    }
```

---

## Relacionamentos Detalhados

### 1. `profiles` → `vehicles` (1:N)

**Cardinalidade:** Um perfil pode ter múltiplos veículos  
**FK:** `vehicles.owner_id` → `profiles.id`  
**Ação cascata:** `ON DELETE CASCADE`

**Regra de negócio:** Apenas motoristas podem criar veículos. Admins podem verificar veículos.

---

### 2. `profiles` → `rides` (1:N)

**Cardinalidade:** Um perfil pode criar múltiplas viagens  
**FK:** `rides.driver_id` → `profiles.id`  
**Ação cascata:** `ON DELETE CASCADE`

**Regra de negócio:** Apenas `role = 'driver'` ou `'admin'` podem criar viagens.

---

### 3. `profiles` → `bookings` (1:N)

**Cardinalidade:** Um perfil pode fazer múltiplas reservas  
**FK:** `bookings.passenger_id` → `profiles.id`  
**Ação cascata:** `ON DELETE CASCADE`

**Regra de negócio:** Passageiro não pode reservar a mesma viagem mais de uma vez.

---

### 4. `profiles` ↔ `messages` (1:N self-referencing)

**Cardinalidade:** Um perfil envia e recebe múltiplas mensagens  
**FKs:** 
- `messages.sender_id` → `profiles.id`
- `messages.receiver_id` → `profiles.id`

**Regra de negócio:** Apenas participantes da conversa podem ver mensagens.

---

### 5. `profiles` ↔ `reviews` (1:N self-referencing)

**Cardinalidade:** Um perfil pode escrever e receber múltiplas avaliações  
**FKs:**
- `reviews.reviewer_id` → `profiles.id`
- `reviews.reviewee_id` → `profiles.id`

**Regra de negócio:** Avaliação apenas após viagem completada. Rating 1-5.

---

### 6. `vehicles` → `rides` (1:N)

**Cardinalidade:** Um veículo pode ser usado em múltiplas viagens  
**FK:** `rides.vehicle_id` → `vehicles.id`  
**Ação cascata:** `ON DELETE SET NULL`

**Regra de negócio:** Veículo deve pertencer ao motorista (`owner_id = driver_id`).

---

### 7. `rides` → `bookings` (1:N)

**Cardinalidade:** Uma viagem pode ter múltiplas reservas  
**FK:** `bookings.ride_id` → `rides.id`  
**Ação cascata:** `ON DELETE CASCADE`

**Regra de negócio:** Reservas decrementam `available_seats`. Cancelamento restaura assentos.

---

### 8. `rides` → `waypoints` (1:N)

**Cardinalidade:** Uma viagem pode ter múltiplos waypoints  
**FK:** `waypoints.order_index`
**Ação cascata:** `ON DELETE CASCADE`

**Regra de negócio:** Waypoints definem paradas no caminho da viagem.

---

### 9. `bookings` → `reviews` (1:1)

**Cardinalidade:** Um booking gera no máximo 1 review por par (reviewer/reviewee)  
**FK:** `reviews.booking_id` → `bookings.id`

**Regra de negócio:** Apenas após viagem`completed`, ambos podem avaliar.

---

## Cardinalidades Resumo

| Relacionamento | Cardinalidade | PK | FK | Cascade |
|----------------|---------------|----|----|---------|
| profiles → vehicles | 1:N | profiles.id | vehicles.owner_id | CASCADE |
| profiles → rides | 1:N | profiles.id | rides.driver_id | CASCADE |
| profiles → bookings | 1:N | profiles.id | bookings.passenger_id | CASCADE |
| profiles → messages (as sender) | 1:N | profiles.id | messages.sender_id | CASCADE |
| profiles → messages (as receiver) | 1:N | profiles.id | messages.receiver_id | CASCADE |
| profiles → reviews (as reviewer) | 1:N | profiles.id | reviews.reviewer_id | CASCADE |
| profiles → reviews (as reviewee) | 1:N | profiles.id | reviews.reviewee_id | CASCADE |
| profiles → alerts | 1:N | profiles.id | alerts.reporter_id | CASCADE |
| profiles → documents | 1:N | profiles.id | documents.user_id | CASCADE |
| profiles → notifications | 1:N | profiles.id | notifications.user_id | — |
| vehicles → rides | 1:N | vehicles.id | rides.vehicle_id | SET NULL |
| rides → bookings | 1:N | rides.id | bookings.ride_id | CASCADE |
| rides → waypoints | 1:N | rides.id | waypoints.ride_id | CASCADE |
| rides → messages | 1:N | rides.id | messages.ride_id | — |
| rides → reviews | 1:N | rides.id | reviews.ride_id | — |
| rides → alerts | 1:N | rides.id | alerts.target_ride_id | — |
| bookings → reviews | 1:1 | bookings.id | reviews.booking_id | — |
| bookings → messages | 1:N | bookings.id | messages.booking_id | — |

---

## Domínios de Negócio

### Domínio 1: Usuários (`profiles`, `auth_credentials`, `documents`)

- Gestão de perfis de usuários
- Autenticação alternataComnHermesAuth)
- Upload e verificação de documentos

---

## Domínio 2: Viagens (`vehicles`, `rides`, `waypoints`)

- Cadastro de veículos pelos motoristas
- Criação e gerenciamento de viagens
- Waypoints para paradas no caminho

### Domínio 3: Reservas (`bookings`)

- Reserva de assentos em viagens
- Controle de assentos disponíveis
- Transições de status (pending → confirmed → cancelled)

### Domínio 4: Comunicação (`messages`, `notifications`)

- Mensagens entre passageiros e motoristas
- Notificações do sistema

### Domínio 5: Reputação (`reviews`, `alerts`)

- Avaliações pós-viagem
- Reporte de problemas comportamentais

---

## Constraints Check

| Tabela | Constraint | Regra |
|--------|------------|-------|
| `rides` | `total_seats > 0 AND total_seats <= 15` | Máximo 15 assentos por viagem |
| `rides` | `available_seats >= 0 AND available_seats <= total_seats` | Assentos não podem ser negativos |
| `rides` | `price_per_seat > 0` | Preço deve ser positivo |
| `bookings` | `seats_booked > 0` | Devem reservar pelo menos 1 assento |
| `reviews` | `rating >= 1 AND rating <= 5` | Avaliação entre 1 e 5 estrelas |

---

## Índice Performance

| Tabela | Índice | Propósito |
|--------|--------|-----------|
| `profiles` | `idx_profiles_email` | Login por email |
| `profiles` | `idx_profiles_role_verification` | Listar motoristas verificados |
| `rides` | `idx_rides_origin_destination` | Busca por rota |
| `rides` | `idx_rides_status_departure` | Viagens ativas ordenadas |
| `bookings` | `idx_bookings_passenger_status` | Reservas por status |
| `messages` | `idx_messages_is_read` | Mensagens não lidas (parcial) |

---

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. Polícias principais:

### `profiles`
- `SELECT`: Qualquer um autenticado vê todos
- `INSERT/UPDATE/DELETE`: Apenas próprio usuário

### `rides`
- `SELECT`: Qualquer um vê
- `INSERT`: Apenas `driver` ou `admin`
- `UPDATE/DELETE`: Apenas proprietário ou `admin`

### `bookings`
- `SELECT`: Próprio passageiro; motorista da viagem; `admin`
- `INSERT`: Qualquer usuário autenticado
- `UPDATE`: Próprio; motorista do ride; `admin`

### `messages`
- `SELECT`: Apenas participantes
- `INSERT`: Apenas remetente
- `UPDATE`: Apenas destinatário (leitura)

---

**Documento gerado por:** Reversa Data Master  
**Forma:** Mermaid.js ERD + Relacionamento detalhado  
**Confiança:** 🟢 DDL direto consulta de migrations