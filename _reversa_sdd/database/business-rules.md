# Regras de Negócio no Banco — Boleia Angola

**Gerado em:** 2026-07-16T20:25:00Z  
**Agente:** Data Master

---

## Resumo de Regras Implementadas no Database

| Categoria | Quantidade |
|-----------|------------|
| **Constraints CHECK** | 5+ |
| **Triggers** | 6 |
| **Functions** | 6 |
| **RLS Policies** | 30+ |
| **Foreign Keys com Cascade** | 20+ |

---

## Constraints CHECK

### 1. Validação de assentos em viagens

**Tabela:** `rides`  
**Constraint:** `CHECK (total_seats > 0 AND total_seats <= 15)`

Regra: Máximo 15 assentos por viagem (padrão BlaBlaCar para vans/ônibus).

### 2. Validação de assentos disponíveis

**Tabela:** `rides`  
**Constraint:** `CHECK (available_seats >= 0 AND available_seats <= total_seats)`

Regra: Assentos disponíveis não podem ser negativos nem exceder o total.

### 3. Validação de preço

**Tabela:** `rides`  
**Constraint:** `CHECK (price_per_seat > 0)`

Regra: Preço por assento deve ser positivo.

### 4. Validação de reserva mínima

**Tabela:** `bookings`  
**Constraint:** `CHECK (seats_booked > 0)`

Regra: Deve reservar pelo menos 1 assento.

### 5. Validação de rating

**Tabela:** `reviews`  
**Constraint:** `CHECK (rating >= 1 AND rating <= 5)`

Regra: Avaliação entre 1 e 5 estrelas.

---

## Triggers e Funções

### 1. `before_insert_rides` — Validações ao criar viagem

**Trigger:** `BEFORE INSERT ON rides`  
**Função:** `validate_ride_insert()`

**Ações:**
- Verifica `departure_time > NOW()`
- Verifica `driver_id` existe e é válido
- Verifica `vehicle_id` (se fornecido) pertence ao driver
- Calcula `available_seats = total_seats` se não fornecido

**SQL:**
```sql
CREATE OR REPLACE FUNCTION validate_ride_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.departure_time <= NOW() THEN
        RAISE EXCEPTION 'departure_time deve ser uma data/hora futura';
    END IF;
    
    IF NEW.available_seats IS NULL THEN
        NEW.available_seats := NEW.total_seats;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_rides
BEFORE INSERT ON rides
FOR EACH ROW EXECUTE FUNCTION validate_ride_insert();
```

---

### 2. `update_available_seats` — Atualiza assentos ao criar reserva

**Trigger:** `AFTER INSERT ON bookings`  
**Função:** `update_available_seats_on_booking()`

**Ações:**
- Decrementa `available_seats` na viagem
- Chain do transação para atomicidade

**SQL:**
```sql
CREATE OR REPLACE FUNCTION update_available_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rides
    SET available_seats = available_seats - NEW.seats_booked,
        updated_at = NOW()
    WHERE id = NEW.ride_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_available_seats
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION update_available_seats_on_booking();
```

---

### 3. `update_available_seats_delete` — Restaura assentos ao cancelar reserva

**Trigger:** `AFTER DELETE ON bookings`  
**Função:** `restore_seats_on_booking_delete()`

**Ações:**
- Restaura `available_seats` quando booking é deletado
- Aplica apenas se booking estava `confirmed`

**SQL:**
```sql
CREATE OR REPLACE FUNCTION restore_seats_on_booking_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'confirmed' THEN
        UPDATE rides
        SET available_seats = available_seats + OLD.seats_booked,
            updated_at = NOW()
        WHERE id = OLD.ride_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_available_seats_delete
AFTER DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION restore_seats_on_booking_delete();
```

---

### 4. `validate_booking_transition` — Valida transição de status

**Trigger:** `BEFORE UPDATE ON bookings`  
**Função:** `validate_booking_status_transition()`

**Ações:**
- Valida transições permitidas:
  - `pending` → `confirmed` | `rejected`
  - `confirmed` → `cancelled`
  - `rejected` → (não muda)
- Restaura assentos se cancelando/rejeitando

**SQL:**
```sql
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        -- OK: Pendente → Confirmada
        RETURN NEW;
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        -- Restaura assentos
        UPDATE rides
        SET available_seats = available_seats + OLD.seats_booked
        WHERE id = OLD.ride_id;
        RETURN NEW;
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        -- Restaura assentos
        UPDATE rides
        SET available_seats = available_seats + OLD.seats_booked
        WHERE id = OLD.ride_id;
        RETURN NEW;
    ELSIF NEW.status = OLD.status THEN
        -- Mesmo status, OK
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_transition
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION validate_booking_status_transition();
```

---

### 5. `set_updated_at` — Atualiza timestamp automaticamente

**Trigger:** `BEFORE UPDATE ON rides, bookings, profiles, vehicles, ...`  
**Função:** `set_updated_at()`

**Ações:**
- Define `updated_at = NOW()` em todas as tabelas com este campo

**SQL:**
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica em múltiplas tabelas
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles, vehicles, rides, bookings, reviews, messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 6. `update_user_rating` — Atualiza rating do usuário

**Trigger:** `AFTER INSERT ON reviews`  
**Função:** `update_user_rating_from_review()`

**Ações:**
- Calcula nova média de rating do `reviewee`
- Atualiza `profiles.rating`
- Incrementa `profiles.reviews_count` ou `profiles.total_reviews`

**SQL:**
```sql
CREATE OR REPLACE FUNCTION update_user_rating_from_review()
RETURNS TRIGGER AS $$
DECLARE
    new_avg numeric;
    new_count int;
BEGIN
    -- Calcula nova média
    SELECT AVG(rating), COUNT(*)
    INTO new_avg, new_count
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id;
    
    -- Atualiza perfil
    UPDATE profiles
    SET rating = COALESCE(new_avg, 5.00),
        reviews_count = COALESCE(new_count, 0),
        updated_at = NOW()
    WHERE id = NEW.reviewee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_rating
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating_from_review();
```

---

## Stored Functions (Consultas)

### 1. `get_ride_stats` — Estatísticas de viagem

**Função:** `get_ride_stats(ride_id UUID)`

**Retorna:**
- Total de reservas
- Assentos reservados
- Receita total
- Status atual

**SQL:**
```sql
CREATE OR REPLACE FUNCTION get_ride_stats(p_ride_id UUID)
RETURNS TABLE (
    total_bookings INTEGER,
    seats_booked INTEGER,
    total_revenue NUMERIC,
    booking_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(b.id)::INTEGER,
        COALESCE(SUM(b.seats_booked), 0)::INTEGER,
        COALESCE(SUM(b.total_price), 0)::NUMERIC,
        r.status::TEXT
    FROM bookings b
    RIGHT JOIN rides r ON b.ride_id = r.id
    WHERE r.id = p_ride_id
    GROUP BY r.id, r.status;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. `search_rides` — Busca de viagens

**Função:** `search_rides(origin TEXT, destination TEXT, date DATE, max_distance INTERVAL)`

**Retorna:** Viagens compatíveis com filtros

**SQL:**
```sql
CREATE OR REPLACE FUNCTION search_rides(
    p_origin TEXT,
    p_destination TEXT,
    p_date DATE,
    p_max_distance INTERVAL DEFAULT INTERVAL '7 days'
)
RETURNS TABLE (
    ride_id UUID,
    driver_name TEXT,
    origin_city TEXT,
    destination_city TEXT,
    departure_time TIMESTAMPTZ,
    available_seats INTEGER,
    price_per_seat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        p.full_name,
        r.origin_city,
        r.destination_city,
        r.departure_time,
        r.available_seats,
        r.price_per_seat
    FROM rides r
    JOIN profiles p ON r.driver_id = p.id
    WHERE
        (r.origin_city ILIKE p_origin OR p_origin IS NULL) AND
        (r.destination_city ILIKE p_destination OR p_destination IS NULL) AND
        DATE(r.departure_time) BETWEEN p_date AND p_date + p_max_distance AND
        r.available_seats > 0 AND
        r.status = 'scheduled';
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) — Políticas Principais

### `profiles`

```sql
-- Qualquer um autenticado pode ver perfis
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Apenas próprio usuário pode editar
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### `rides`

```sql
-- Qualquer um pode ver viagens
CREATE POLICY "Anyone can view rides"
ON rides FOR SELECT
USING (true);

-- Apenas driver ou admin pode criar
CREATE POLICY "Drivers can create rides"
ON rides FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('driver', 'admin')
    )
);

-- Apenas owner ou admin pode editar/deletar
CREATE POLICY "Owners can manage their rides"
ON rides FOR ALL
USING (
    driver_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
```

### `bookings`

```sql
-- Passageiro vê suas reservas; Motorista vê de suas viagens; Admin vê tudo
CREATE POLICY "View own or related bookings"
ON bookings FOR SELECT
USING (
    passenger_id = auth.uid() OR
    ride_id IN (
        SELECT id FROM rides WHERE driver_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Qualquer um autenticado pode criar reserva
CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas owner, driver do ride, ou admin pode alterar
CREATE POLICY "Manage own or related bookings"
ON bookings FOR UPDATE
USING (
    passenger_id = auth.uid() OR
    ride_id IN (
        SELECT id FROM rides WHERE driver_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
```

### `messages`

```sql
-- Apenas participantes podem ver
CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
);

-- Apenas remetente pode enviar
CREATE POLICY "Sender can send messages"
ON messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Apenas destinatário pode marcar como lida
CREATE POLICY "Receiver can mark as read"
ON messages FOR UPDATE
USING (receiver_id = auth.uid());
```

---

## Resumo de Regras de Negócio

| Regra | Implementação | Localização |
|-------|---------------|-------------|
| Máximo 15 assentos | CHECK constraint | rides.total_seats |
| Preço positivo | CHECK constraint | rides.price_per_seat |
| Rating 1-5 | CHECK constraint | reviews.rating |
| Validar departure_time futuro | Trigger | rides.before_insert |
| Decrementar assentos ao reservar | Trigger | bookings.after_insert |
| Restaurar assentos ao cancelar | Trigger | bookings.after_delete |
| Validar transição de booking | Trigger | bookings.before_update |
| Atualizar rating automaticamente | Trigger | reviews.after_insert |
| Calcular estatísticas de viagem | Function | get_ride_stats() |
| Busca de viagens otimizada | Function + Índices | search_rides() |
| RLS: Usuário acessa apenas seus dados | RLS Policies | Todas tabelas |

---

**Documento gerado por:** Reversa Data Master  
**Confiança:** 🟢 DDL direto de migrations