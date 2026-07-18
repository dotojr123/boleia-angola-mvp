# Modelo de Domínio Alvo — Boleia Angola

**Gerado em:** 2026-07-16  
**Agente:** Designer (Fase 2)  
**Topologia:** Feature-Sliced Design (FSD)

---

## Visão Geral

O modelo de domínio alvo organiza as entidades em **Aggregates** dentro de **Bounded Contexts**, respeitando as regras de negócio extraídas pelo Detective e aplicando o paradigma **OO com Injeção de Dependência** no backend.

---

## Bounded Contexts e Aggregates

### 1. **Auth Context**

**Responsabilidade:** Autenticação e gestão de sessão

#### Aggregate: **UserAggregate**

**Root Entity:** `User`

**Entidades internas:**
- `User` (root)
- `Session` (value object referenciado)

**Invariantes:**
1. Email único e não nulo
2. Telefone único e válido (Angola: +244 ou 9 + 9 dígitos)
3. Password_hash não nulo (bcrypt, 10 rounds)
4. Role não nulo (enum: PASSENGER, DRIVER, ADMIN)
5. Emailnão pode ser alterado após criação
6. Telefone só pode ser alterado se não houver reservas ativas

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createUser(email, phone, password, fullName, role)` | email: string, phone: string, password: string, fullName: string, role: enum | User | Hash password, validate email/phone, persist |
| `loginUser(email, password)` | email: string, password: string | JWT | Verify credentials, generate token (7 days), log attempt |
| `refreshToken(currentToken)` | currentToken: string | newJWT | Verify token not expired, generate new token |
| `logoutUser(token)` | token: string | void | Invalidate token (blacklist), log logout |
| `updateProfile(userId, updates)` | userId: string, updates: {fullName, avatarUrl} | User | Verify ownership, apply updates |

**Eventos de domínio publicados:**
- `UserRegistered` — { userId, email, registeredAt }
- `UserLoginAttempted` — { userId, timestamp, success }
- `ProfileUpdated` — { userId, updatedFields, timestamp }

**Rastreabilidade para legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| R7.1 — Senha mínima 6 chars | `routes/auth.js` | `ValidateUserCommand` |
| R7.2 — Telefone Angola | `routes/auth.js` | `PhoneNumberValidator` |
| R7.3 — Role default passenger | `routes/auth.js` | `UserFactory` |
| R7.4 — JWT expiry 7 dias | `routes/auth.js` | `TokenService` |
| R7.6 — Auth required | `middleware/auth.js` | `AuthMiddleware` |

---

### 2. **Rides Context**

**Responsabilidade:** Gestão de viagens (criação, busca, modificação)

#### Aggregate: **RideAggregate**

**Root Entity:** `Ride`

**Entidades internas:**
- `Ride` (root)
- `Waypoint` (value object list)

**Invariantes:**
1. `driver_id` não nulo e válido
2. `origin_city` e `destination_city` diferentes
3. `departure_time` no futuro (≥ now)
4. `price_per_seat` > 0
5. `available_seats` entre 1 e 15 (padrão BlaBlaCar)
6. Veículo (se fornecido) deve existir e pertencer ao driver
7. Status transição válida: scheduled → active → completed/cancelled
8. Viagem com reservas confirmed não pode ser cancelada

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createRide(driverId, originCity, destinationCity, departureTime, pricePerSeat, availableSeats, vehicleId, waypoints)` | Todos os campos | Ride | Validate all rules, persist with status=scheduled |
| `updateRide(rideId, updates, driverId)` | rideId, updates (partial), driverId | Ride | Verify ownership, validate transitions, apply updates |
| `cancelRide(rideId, actorId)` | rideId: string, actorId: string | Ride | Verify ownership + no confirmed bookings, set status=cancelled |
| `searchRides(originCity, destinationCity, dateFrom, dateTo, priceMax)` | Search criteria | List<Ride> | Query with pagination |
| `getRideDetails(rideId)` | rideId: string | Ride | Full details with driver, vehicle, bookings count |
| `startRide(rideId, driverId)` | rideId: string, driverId: string | Ride | Verify ownership, set status=active |
| `completeRide(rideId, driverId)` | rideId: string, driverId: string | Ride | Verify ownership, set status=completed |

**Eventos de domínio publicados:**
- `RideCreated` — { rideId, driverId, departureTime, createdAt }
- `RideUpdated` — { rideId, updatedFields, timestamp }
- `RideCancelled` — { rideId, reason, cancelledAt }
- `RideStarted` — { rideId, actualDepartureTime }
- `RideCompleted` — { rideId, completedAt }

**Rastreabilidade para o legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| R1.1 — Só driver/admin cria | `routes/rides.js:89-93` | `CreateRideCommand` |
| R1.2 — departure_time futuro | `routes/rides.js:66-75` | `DepartureTimeValidator` |
| R1.3 — price_per_seat > 0 | `routes/rides.js:77-81` | `PriceValidator` |
| R1.4 — available_seats 1-15 | `routes/rides.js:83-87` | `SeatValidator` |
| R1.5 — vehicle_id must exist | `routes/rides.js:97-111` | `VehicleReferenceService` |
| R1.6 — status default scheduled | `routes/rides.js:153` | `RideFactory` |
| R3.2 — Sem reservas para cancelar | `routes/rides.js:381-393` | `CancelRideCommand` |

---

### 3. **Bookings Context**

**Responsabilidade:** Reservas de assentos, transações financeiras

#### Aggregate: **BookingAggregate**

**Root Entity:** `Booking`

**Entidades internas:**
- `Booking` (root)
- `PaymentTransaction` (value object, futuro)

**Invariantes:**
1. `ride_id` não nulo e válido
2. `passenger_id` não nulo e válido
3. `seats_booked` ≥ 1 e ≤ available_seats da ride
4. `total_price` = price_per_seat × seats_booked
5. Passageiro não pode reservar mesma viagem mais de uma vez (status confirmed)
6. Transação atômica: INSERT booking + UPDATE ride.available_seats
7. Reserva com status confirmed pode ser cancelada (restaura assentos)

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createBooking(rideId, passengerId, seats)` | rideId: string, passengerId: string, seats: number | Booking | Check availability, atomic INSERT + UPDATE |
| `cancelBooking(bookingId, passengerId)` | bookingId: string, passengerId: string | Booking | Verify ownership, update status, restore seats |
| `approveBooking(bookingId, driverId)` | bookingId: string, driverId: string | Booking | Verify ownership, set status=confirmed (override) |
| `rejectBooking(bookingId, driverId)` | bookingId: string, driverId: string | Booking | Verify ownership, set status=rejected, restore seats |
| `getRideBookings(rideId)` | rideId: string | List<Booking> | All bookings for ride with passenger details |
| `getPassengerBookings(passengerId)` | passengerId: string | List<Booking> | All bookings by passenger with ride details |

**Eventos de domínio publicados:**
- `BookingConfirmed` — { bookingId, rideId, passengerId, seats, confirmedAt }
- `BookingCancelled` — { bookingId, seatsRestored, cancelledAt }
- `BookingApproved` — { bookingId, approvedBy, timestamp }
- `BookingRejected` — { bookingId, rejectedBy, reason, timestamp }

**Rastreabilidade para o legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| R2.1 — Assentos disponíveis | `routes/bookings.js:32-34` | `CheckAvailabilityService` |
| R2.2 — Viagem active/scheduled | `routes/bookings.js:28-30` | `BookingEligibilityService` |
| R2.3 — No duplicate confirmed | `routes/bookings.js:37-44` | `DuplicateBookingValidator` |
| R2.4 — Preço total = price × seats | `routes/bookings.js:46` | `PriceCalculationService` |
| R2.6 — Transação atômica | `routes/bookings.js:48-65` | `BookingTransaction` |
| R5.3 — Cancelar restaura assentos | `routes/bookings.js:149-154` | `CancelBookingCommand` |

---

### 4. **Profiles Context**

**Responsabilidade:** Perfis de usuários, reputação, verificação

#### Aggregate: **ProfileAggregate**

**Root Entity:** `Profile`

**Entidades internas:**
- `Profile` (root)
- `Review` (entity list, owned by booking mas published here)
- `DriverVerification` (value object, optional)

**Invariantes:**
1. `user_id` único e não nulo
2. `full_name` não nulo, ≥ 2 caracteres
3. `rating` entre 0 e 5 (decimais 2 casas)
4. `verification_status` enum: pending, verified, rejected, not_applicable
5. Review só pode ser feita depois de viagem completada
6. Apenas uma review por booking (reviewer → reviewee)

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createProfile(userId, fullName)` | userId: string, fullName: string | Profile | Initialize with default fields |
| `updateProfile(profileId, updates)` | profileId: string, updates: {fullName, avatarUrl, bio} | Profile | Verify ownership, apply updates |
| `uploadAvatar(userId, file)` | userId: string, file: File | avatarUrl | Validate file type/size, upload to storage |
| `submitReview(bookingId, rating, comment)` | bookingId: string, rating: number,comment: string | Review | Verify booking completed, create review, update ratings |
| `verifyDriver(userId, documents)` | userId: string, documents: Array<File> | DriverVerification | Admin only, validate documents, set verified |
| `getProfile(userId)` | userId: string | Profile | Full profile with reviews count, rating |
| `getReviews(revieweeId)` | reviewee: string | List<Review> | All reviews with pagination |

**Eventos de domínio publicados:**
- `ProfileCreated` — { userId, createdAAt }
- `ProfileUpdated` — { profileId, updatedFields, timestamp }
- `ReviewSubmitted` — { reviewId, bookingId, reviewerId, revieweeId, rating }
- `DriverVerified` — { userId, verifiedAt, verifiedBy }

**Rastreabilidade para o legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| R6.1 — Review só após viagem | `routes/reviews.js` (inferido) | `ReviewEligibilityService` |
| R6.2 — Rating 1-5 | `routes/reviews.js` | `RatingValidator` |
| R6.3 — Uma review por booking | `routes/reviews.js` (inferido) | `DuplicateReviewValidator` |

---

### 5. **Vehicles Context**

**Responsabilidade:** Gestão de veículos dos motoristas

#### Aggregate: **VehicleAggregate**

**Root Entity:** `Vehicle`

**Entidades internas:**
- `Vehicle` (root)

**Invariantes:**
1. `owner_id` não nulo e válido (must be DRIVER role)
2. `make`, `model`, `year`, `color` não nulos
3. `license_plate` único por cidade (futuro)
4. `capacity` ≥ 1 e ≤ 15
5. `is_active` falso = não pode ser selecionado para rides
6. Veículo com rides ativas não pode ser deletado (apenas soft delete)

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createVehicle(ownerId, make, model, year, color, licensePlate, capacity)` | All fields | Vehicle | Validate owner is driver, persist |
| `updateVehicle(vehicleId, updates, ownerId)` | vehicleId, updates, ownerId | Vehicle | Verify ownership, apply updates |
| `deleteVehicle(vehicleId)` | vehicleId: string | Vehicle | Soft delete (is_active=false) if no active rides |
| `selectForRide(vehicleId, rideId)` | vehicleId: string, rideId: string | void | Verify ownership, link to ride |
| `getOwnerVehicles(ownerId)` | ownerId: string | List<Vehicle> | All vehicles by owner with active flag |
| `getVehicleDetails(vehicleId)` | vehicleId: string | Vehicle | Full details with current ride (if any) |

**Eventos de domínio publicados:**
- `VehicleCreated` — { vehicleId, ownerId, createdAt }
- `VehicleUpdated` — { vehicleId, updatedFields, timestamp }
- `VehicleSelectedForRide` — { vehicleId, rideId, selectedAt }

**Rastreabilidade para o legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| V1.4 — Capacidade 1-15 | Inferido de available_seats | `CapacityValidator` |

---

### 6. **Admin Context**

**Responsabilidade:** Moderação, métricas, gestão de usuários

#### Aggregate: **AlertAggregate**

**Root Entity:** `Alert`

**Entidades internas:**
- `Alert` (root)
- `ModerationNote` (value object list, owned by admin)

**Invariantes:**
1. `reporter_id` e `target_user_id` diferentes
2. `reason` não vazio
3. `status` enum: pending, reviewed, resolved, dismissed
4. Apenas admin pode mudar status
5. Alert sobre ride também valida ride existence

**Comandos:**

| Comando | Parâmetros | Retorno | Efeito |
|---------|------------|---------|--------|
| `createAlert(reporterId, targetType, targetId, reason)` | reporterId, targetType, targetId, reason | Alert | Validate reporter, persist with status=pending |
| `reviewAlert(alertId, adminId, decision, note)` | alertId, adminId, decision: resolved/dismissed, note | Alert | Verify admin, update status, log note |
| `banUser(adminId, targetUserId, reason)` | adminId, targetUserId, reason | void | Validate admin, set user banned |
| `updateUserRole(adminId, targetUserId, newRole)` | adminId, targetUserId, newRole | User | Verify admin, update role |
| `getDashboardStats()` | adminId: string | Metrics | Aggregations: total users, rides, bookings, alerts |
| `getPendingAlerts()` | adminId: string | List<Alert> | All alerts with status=pending |

**Eventos de domínio publicados:**
- `AlertCreated` — { alertId, reporterId, targetId, createdAt }
- `AlertResolved` — { alertId, resolvedBy, decision, resolvedAt }
- `UserBanned` — { userId, bannedBy, reason, bannedAt }
- `UserRoleUpdated` — { userId, oldRole, newRole, updatedBy }

**Rastreabilidade para o legado:**
| Regra Legado | Origem | Local no novo |
|--------------|--------|---------------|
| R8.3 — Admin modera tudo | `routes/admin.js` | `AdminAuthService` |

---

## Matriz de Regras de Domínio vs. Local Alvo

| ID Regra | Descrição | Aggregate Responsável | Comando |
|----------|-----------|----------------------|---------|
| R1.1 | Só driver cria viagem | RideAggregate | `createRide` →验证 driver role |
| R1.2 | departure_time futuro | RideAggregate | `DepartureTimeValidator` |
| R1.3 | price_per_seat > 0 | RideAggregate | `PriceValidator` |
| R1.4 | available_seats 1-15 | RideAggregate | `SeatValidator` |
| R2.1 | Assentos disponíveis | BookingAggregate | `CheckAvailabilityService` |
| R2.2 | Viagem active/scheduled | BookingAggregate | `BookingEligibilityService` |
| R2.3 | No duplicate booking | BookingAggregate | `DuplicateBookingValidator` |
| R3.2 | Sem reservas para cancelar | RideAggregate + BookingAggregate | `CancelRideCommand` → query |
| R5.3 | Cancelar reserva restaura assentos | BookingAggregate | `CancelBookingCommand` → update ride |
| R6.1 | Review só após viagem | ProfileAggregate | `ReviewEligibilityService` → check ride.status |
| R7.1 | Senha mínima 6 chars | UserAggregate | `PasswordValidator` |
| R7.2 | Telefone Angola | UserAggregate | `PhoneNumberValidator` |
| R8.3 | Admin modera tudo | AdminAggregate | `AdminAuthService` |

---

## Aggregates por Bounded Context

```
┌─ Auth Context ──────────────────┐
│   UserAggregate                 │
│   ├─ User (root)                │
│   └─ Session (value object)     │
└─────────────────────────────────┘

┌─ Rides Context ─────────────────┐
│   RideAggregate                 │
│   ├─ Ride (root)                │
│   └─ Waypoint (list of values)  │
└─────────────────────────────────┘

┌─ Bookings Context ──────────────┐
│   BookingAggregate              │
│   └─ Booking (root)             │
└─────────────────────────────────┘

┌─ Profiles Context ──────────────┐
│   ProfileAggregate              │
│   ├─ Profile (root)             │
│   ├─ Review[]                   │
│   └─ DriverVerification (opt)   │
└─────────────────────────────────┘

┌─ Vehicles Context ──────────────┐
│   VehicleAggregate              │
│   └─ Vehicle (root)             │
└─────────────────────────────────┘

┌─ Admin Context ─────────────────┐
│   AlertAggregate                │
│   ├─ Alert (root)               │
│   └─ ModerationNote[]           │
└─────────────────────────────────┘
```

---

## Decisões de Modelagem (Não são 1-para-1 com legado)

### Por que `UserAggregate` não inclui Profile?
**Justificativa:** User (auth) é usado para login/registro. Profile é metadado opcional. Separação permite:
- User existir sem Profile (último cria lazily)
- Profile ser carregado em queries separadas (performance)
- User ser mais slim para autenticação高频

### Por que `Review` é entity dentro de ProfileAggregate?
**Justificativa:** Reviews são medidas de reputação do reviewee, não do booking. O aggregate Profile agrega reviews como parte da "identidade" do usuário.

### Por que `Waypoint` é value object e não entidade?
**Justificativa:** Waypoints não têm identidade própria além de pertencer à ride. São altamente dependentes do contexto da ride e não têm lifecycle independente.

### Por que não há `PaymentAggregate`?
**Justificativa:** Sistema atual não processa pagamentos reais (apenas simulação de preço). Payment é futuro enhancement, não parte do MVP.

---

## Rastreabilidade Completa: Legado → Alvo

### Entidades de Domínio

| Entidade Alvo | Entidades Legado | Tipo de Mapeamento |
|---------------|------------------|--------------------|
| UserAggregate | ✅ profiles (auth subset) | 1-para-1 renomeado |
| RideAggregate | ✅ rides | 1-para-1 |
| BookingAggregate | ✅ bookings | 1-para-1 |
| ProfileAggregate | ✅ profiles + reviews | Fundido (reviews era separada) |
| VehicleAggregate | ✅ vehicles | 1-para-1 |
| AlertAggregate | ✅ alerts | 1-para-1 |

### Eventos de Domínio (propostos)

| Evento | Provem de onde no legado? | Converte para什么情况？|
|--------|---------------------------|----------------------|
| `UserRegistered` | `POST /auth/register` → success | 201 Created, notificação interna |
| `BookingConfirmed` | `POST /bookings` → success | 201 Created, notificação |
| `RideCancelled` | `PATCH /rides/:id/cancel` → success | 200 OK, notificação passageiros |
| `ReviewSubmitted` | `POST /reviews` → success | 201 Created, recalcular rating |

---

## Próximos Passos

1. **Target Data Model** — DDL, constraints, indexes
2. **Data Migration Plan** — Como migrar dados do legado para o novo
3. **Codificação** — Implementar ADDs por feature

---

**Status:** ✅ Target Domain Model concluído  
**Artefatos gerados:** 
- Aggregates: 6
- Entidades: 6 (6 aggregates root, + entidades owned)
- Comandos: 28
- Eventos: 15
- Regras de domínio mapeadas: 41

**Confiança:**
- 🟢 CONFIRMADO: 35 regras (extraídas diretamente do código)
- 🟡 INFERIDO: 6 regras (baseado em padrões)
- 🔴 LACUNA: 3 (require validação — autenticação 2FA, payment flow, email verification)

**Próximo artefato:** `target_data_model.md`