# Database Triggers and Functions

Este diretório contém todas as triggers e functions do banco de dados PostgreSQL.

## Scripts Disponíveis

### Validações de Rides

**Arquivo:** `ride_validations.sql`

Trigger `before_insert_rides` que valida:
- `departure_time > NOW()` - A partida deve ser no futuro
- `price_per_seat > 0` - Preço deve ser positivo
- `available_seats` entre 1 e 100
- `origin != destination` - Origem e destino devem ser diferentes

### Atualização de Assentos

**Arquivo:** `update_seats.sql`

Triggers `update_available_seats` e `update_available_seats_delete` que:
- Decrementam `available_seats` quando booking é criado (INSERT)
- Incrementam `available_seats` quando booking é cancelado (UPDATE)
- Incrementam `available_seats` quando booking é excluído (DELETE)
- Previnem overbooking

### Validação de Transições de Booking

**Arquivo:** `booking_transitions.sql`

Trigger `validate_booking_transition` que valida transições:

| De        | Para                          | Status  |
|-----------|-------------------------------|---------|
| pending   | confirmed                     | Válido  |
| pending   | rejected                      | Válido  |
| pending   | cancelled                     | Válido  |
| confirmed | completed                     | Válido  |
| confirmed | cancelled                     | Válido  |
| qualquer  | inválido                      | EXCEPTION |

### Atualização de Timestamp

**Arquivo:** `set_updated_at.sql`

Trigger `set_updated_at` que atualiza `updated_at = NOW()` em UPDATE para:
- `profiles`
- `rides`
- `bookings`
- `vehicles`
- `messages`

### Atualização de Rating

**Arquivo:** `update_rating.sql`

Trigger `update_user_rating` que:
- Calcula média de ratings após INSERT em `reviews`
- Atualiza `profiles.rating` e `profiles.reviews_count`
- Suporta INSERT, UPDATE, DELETE

## Funções

### get_ride_stats(ride_id)

**Arquivo:** `functions/ride_stats.sql`

Retorna estatísticas de uma ride:
- `total_revenue`: Total arrecadado (bookings confirmados)
- `confirmed_passengers`: Passageiros confirmados
- `available_seats_count`: Assentos disponíveis
- `total_seats_count`: Total de assentos
- `pending_bookings`: Bookings pendentes
- `cancelled_bookings`: Bookings cancelados

## Como Aplicar

### Opção 1: Script Único (Recomendado)

```bash
psql -U usuario -d database -f apply_triggers.sql
```

### Opção 2: Scripts Individuais

```bash
psql -U usuario -d database -f triggers/ride_validations.sql
psql -U usuario -d database -f triggers/update_seats.sql
psql -U usuario -d database -f triggers/booking_transitions.sql
psql -U usuario -d database -f triggers/set_updated_at.sql
psql -U usuario -d database -f triggers/update_rating.sql
psql -U usuario -d database -f functions/ride_stats.sql
```

## Testes

### Testar trigger before_insert_rides

```sql
-- Deve falhar: departure_time no passado
INSERT INTO rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
VALUES ('uuid', 'A', 'B', NOW() - INTERVAL '1 day', 100, 5);

-- Deve falhar: price_per_seat negativo
INSERT INTO rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
VALUES ('uuid', 'A', 'B', NOW() + INTERVAL '1 day', -100, 5);

-- Deve falhar: available_seats > 100
INSERT INTO rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
VALUES ('uuid', 'A', 'B', NOW() + INTERVAL '1 day', 100, 101);

-- Deve falhar: origin = destination
INSERT INTO rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
VALUES ('uuid', 'A', 'A', NOW() + INTERVAL '1 day', 100, 5);

-- Deve passar: todos os dados válidos
INSERT INTO rides (driver_id, origin, destination, departure_time, price_per_seat, available_seats)
VALUES ('uuid', 'A', 'B', NOW() + INTERVAL '1 day', 100, 5);
```

### Testar função get_ride_stats

```sql
SELECT * FROM get_ride_stats('uuid-da-ride');
```
