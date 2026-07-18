# Arquitetura Alvo — Boleia Angola

**Gerado em:** 2026-07-16  
**Agente:** Designer (Fase 2)  
**Topologia:** Feature-Sliced Design (FSD)

---

## Visão Geral

A arquitetura alvo mantém o stack tecnológico atual (React + Express + PostgreSQL) mas reorganiza o código para **Feature-Sliced Design (FSD)** com **Bounded Contexts explícitos**. Esta abordagem permite:

- **Isolamento de domínios**: cada feature evolui independentemente
- **Testabilidade**: vertical slices facilitam testes de integração
- **Onboarding rápido**: devs focam em 1 feature por vez
- **Migração gradual**: padrão strangler fig sobre o legado

---

## Diagrama de Arquitetura (C4 Nível 2)

```mermaid
C4Container
  title Arquitetura Alvo — Boleia Angola (Feature-Sliced Design)
  
  Person(passenger, " Passageiro", "Usuário que busca e reserva caronas")
  Person(driver, " Motorista", "Usuário que oferece caronas e gerencia viagens")
  Person(admin, " Administrador", "Gerencia usuários, modera conteúdo")
  
  Systemenqueue
    System(fsd_frontend, "Frontend (React + FSD)", "SPA organizada por features")
    System(fsd_backend, "Backend (Express + FSD)", "API organizada por bounded contexts")
    SystemDb(postgres, "PostgreSQL", "Dados persistentes")
  
  Rel(passenger, fsd_frontend, "HTTPS/React", "UI")
  Rel(driver, fsd_frontend, "HTTPS/React", "UI")
  Rel(admin, fsd_frontend, "HTTPS/React", "UI")
  
  Rel(fsd_frontend, fsd_backend, "HTTPS/REST", "API calls")
  Rel(fsd_backend, postgres, "SQL/pg", "Data access")
  
  System_Envelope(fsd_frontend, "Frontend FSD") {
    Container_Boundary(features, "features/") {
      Container(auth, "Auth Feature", "React", "Login, Register, JWT management")
      Container(rides, "Rides Feature", "React", "Criar, buscar, gerenciar viagens")
      Container(bookings, "Bookings Feature", "React", "Reservar, cancelar, visualizar reservas")
      Container(profiles, "Profiles Feature", "React", "Perfil, edição, avatar")
      Container(vehicles, "Vehicles Feature", "React", "Gerenciar veículos")
      Container(admin, "Admin Feature", "React", "Dashboard, moderação, usuários")
    }
    Container_Boundary(entities, "entities/") {
      Container(user_entity, "User Entity", "React", "Componentes de usuário compartilhados")
      Container(ride_entity, "Ride Entity", "React", "RideCard, RideSearch, RideList")
    }
    Container_Boundary(shared, "shared/") {
      Container(ui, "UI Kit", "React", "Botão, Input, Modal, Layout")
      Container(lib, "Libs", "TypeScript", "API client, formatters, validators")
    }
  }
  
  System_Envelope(fsd_backend, "Backend FSD") {
    Container_Boundary(be_features, "features/") {
      Container(be_auth, "Auth Feature", "Node.js", "JWT, login, register, refresh")
      Container(be_rides, "Rides Feature", "Node.js", "CRUD rides, search, waypoints")
      Container(be_bookings, "Bookings Feature", "Node.js", "Reservas, transações")
      Container(be_profiles, "Profiles Feature", "Node.js", "Perfil, avatar, optionally verified")
      Container(be_vehicles, "Vehicles Feature", "Node.js", "CRUD veículos")
      Container(be_admin, "Admin Feature", "Node.js", "Moderação, dashboard stats")
    }
    Container_Boundary(be_shared, "shared/") {
      Container(be_lib, "Libs", "Node.js", "DB pool, JWT utils, validators")
      Container(be_middleware, "Middleware", "Node.js", "Auth, rate-limit, error handler")
    }
  }
  
  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
```

---

## Bounded Contexts

### 1. **Auth** 
**Responsabilidade:** Autenticação, autorização, gestão de sessão

**Entidades:**
- User (auth) — email, phone, password_hash, role
- Session — JWT tokens, expiry

**Comandos:**
- `Login(email, password) → JWT`
- `Register(email, phone, password, name) → User + JWT`
- `RefreshToken(token) → new JWT`
- `Logout(token) → void`

**Eventos publicados:**
- `UserRegistered` — para send welcome email (opcional)
- `LoginAttempted` — para audit/security

---

### 2. **Rides**
**Responsabilidade:** Gestão de viagens (criação, busca, atualização)

**Entidades:**
- Ride — driver_id, origin, destination, departure_time, price, seats status
- Waypoint — paradas intermediárias

**Comandos:**
- `CreateRide(driver_id, route,departure_time, price, seats)→ Ride`
- `UpdateRide(ride_id, updates) → Ride`
- `CancelRide(ride_id) → void`
- `SearchRides(origin, destination, date) → List<Ride>`

**Eventos publicados:**
- `RideCreated` — para notificar seguidores
- `RideCancelled` — para notificar passageiros reservados
- `RideUpdated` — para cache invalidation

---

### 3. **Bookings**
**Responsabilidade:** Reservas de assentos, transações de negócio

**Entidades:**
- Booking — ride_id, passenger_id, seats, total_price status

**Comandos:**
- `CreateBooking(ride_id passenger_id,seats) → Booking` (transação: INSERT booking + UPDATE ride.available_seats)
- `CancelBooking(booking_id) → void` (restaura assentos)
- `ApproveBooking(booking_id) → Booking` (override admin)
- `RejectBooking(booking_id) → void`

**Eventos publicados:**
- `BookingConfirmed` — para notificar motorista
- `BookingCancelled` — para notificar motorista restaurar assentos
- `BookingApprove` — para notificar passageiro

---

### 4. **Profiles**
**Responsabilidade:** Perfis de usuários, reputação, verificação

**Entidades:**
- Profile — full_name, avatar, rating, verification_status
- Review — reviewer_id, reviewee_id, rating, comment

**Comandos:**
- `UpdateProfile(user_id, updates) → Profile`
- `UploadAvatar(file) → avatar_url`
- `SubmitReview(booking_id, rating, comment) → Review`
- `VerifyDriver(user_id, documents) → void` (admin only)

**Eventos publicados:**
- `ProfileUpdated` — para invalidar cache
- `ReviewSubmitted` — para recalcular rating

---

### 5. **Vehicles**
**Responsabilidade:** Gestão de veículos dos motoristas

**Entidades:**
- Vehicle — owner_id, make, model, year, color, license_plate, capacity

**Comandos:**
- `CreateVehicle(owner_id, details) → Vehicle`
- `UpdateVehicle(vehicle_id updates)→ Vehicle`
- `DeleteVehicle(vehicle_id) → void` (soft delete is_active)
- `SelectVehicleForRide(vehicle_id, ride_id) → void`

**Eventos publicados:**
- `VehicleCreated` — para validação futura
- `VehicleUpdated` — para invalidar cache

---

### 6. **Admin**
**Responsabilidade:** Moderação, métricas, gestão de usuários

**Entidades:**
- Alert — reporter_id, target_user_id, reason, status
- Metrics — dashboard aggregations

**Comandos:**
- `ReviewAlert(alert_id, decision) → Alert`
- `UpdateUserRole(user_id, new_role) → User`
- `BanUser(user_id, reason) → void`
- `GetDashboardStats() → Metrics`

**Eventos publicados:**
- `AlertResolved` — para notificar reporter
- `UserBanned` — para invalidar session

---

## Honra ao Paradigma Escolhido

**Paradigma:** **OO com Injeção de Dependência** (backend) + **Functional UI components** (frontend)

**Materialização na arquitetura:**

### Backend (Express + OO + DI)
1. **Classes por entidade**: `class RideService`, `class BookingService`
2. **Injeção de dependência via constructor**: services recebem `db`, `authService`, etc.
3. **Separação de camadas clara**:
   - `routes/` — apenas HTTP handling
   - `services/` — business logic
   - `repositories/` — data access
   - `models/` — tipos e validação
4. **Interfaces explícitas**: cada serviço revela um contrato público

**Exemplo estrutura:**
```
server/features/rides/
├── RidesService.js     // Business logic, com injeção de deps
├── RidesRepository.js  // Acesso a dados (SQL)
├── RidesController.js  // HTTP handlers (thin)
└── RidesRouter.js      // Express router (configuração)
```

### Frontend (React + Functional Components)
1. **Components funcionais** com hooks (sem class components)
2. **State management via Context** para global (Auth, Notifications)
3. **Custom hooks para lógica compartilhada**: `useRides()`, `useAuth()`
4. **Imutabilidade**: todos os dados de estado são imutáveis (React state, não mutação direta)

**Exemplo estrutura:**
```
features/rides/
├── ui/
│   ├── RideCard.tsx       // Componente de apresentação
│   ├── RideSearch.tsx     // Formulário de busca
│   └── RideList.tsx       // Lista de resultados
├── api/
│   └── ridesApi.ts        // Chamadas à API (também hook)
├── model/
│   └── rideModel.ts       // Tipos TypeScript, validação zod
└── lib/
    └── useRides.ts        // Custom hook para estado + API
```

---

## Honra à Topologia Escolhida

**Topologia:** Feature-Sliced Design (FSD) — **Opção 2** (transformacional)

**Como a árvore materializa a decisão:**

### Frontend (Reorganização completa)
```
src/ (nova estrutura FSD)
├── features/           # Bounded contexts alinhados com domínio
│   ├── auth/          # → pages/auth/ atual
│   ├── rides/         # → partes de pages/driver/ + pages/passenger/ + pages/public/
│   ├── bookings/      # → partes de pages/passenger/ + pages/driver/
│   ├── profiles/      # → pages/profile/ + partes de pages/driver/
│   ├── vehicles/      # → partes de pages/driver/
│   └── admin/         # → pages/admin/
├── entities/          # Entidades reutilizáveis
│   ├── user/          # Componentes de usuário
│   ├── ride/          # RideCard, SearchResults, etc.
│   └── vehicle/       # VehicleCard, VehicleSelector
├── shared/            # Utilitários brutos
│   ├── ui/            # Button, Input, Modal, Layout
│   ├── lib/           // api.tsit, formatters, validators
│   └── config/        # constantes, env
└── main.tsx → App.tsx (entry point inalterado)
```

### Backend (Reorganização gradual)
```
server/src/ (estrutura híbrida durante transição)
├── features/          # Novas features seguem FSD
│   ├── auth/
│   │   ├── RidesService.js
│   │   ├── RidesRepository.js
│   │   └── RidesController.js
│   └── ...
├── routes/            # Rotas antigas permanecem até migração
├── middleware/        // Inalterado
└── config/            // Inalterado
```

**Estratégia de migração:**
1. Criar pasta `features/` paralela a `routes/`
2. Migrar 1 módulo por vez (auth → rides → bookings → ...)
3. Manter ambas estruturas até nova estrutura estável
4. Remover `routes/` antigos após validação

---

## Decisões Arquiteturais com Rastreabilidade

| Decisão | Justificativa | Rastreabilidade |
|---------|---------------|-----------------|
| Feature-Sliced Design | Domínios claros, evolução independente | Topologia escolhida: Opção 2 |
| OO no backend + DI | Inspeção clara, testabilidade, manutenção | Padrão BlaBlaCar, facilidade TDD |
| Functional UI no frontend | React moderno, hooks, hooks de compartilhamento | Stack atual não varia |
| Context para state global | Simplicidade, sem overhead de Redux/Zustand | `AuthContext` + `NotificationContext` já existem |
| PostgreSQL relacional | Dados estruturados, AG e transacionais | Schema atual 16 tabelas, manutenível |
| JWT 7 days | Balance entre segurança e UX | Regra de negócio R7.4 |
| Citation:R5.4 | Reservation cancellation restores seats | Regra de negócio R5.4 |
| VanilllllJS backend | Stack atual sem variação | `server/src` inalterado framework |

---

## Estrutura Final FSD (Árvore Completa)

```
boleia-angola/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── ui/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   ├── model/
│   │   │   │   ├── authModel.ts
│   │   │   │   └── loginSchema.ts
│   │   │   └── lib/
│   │   │       ├── useAuth.ts
│   │   │       └── validateLogin.ts
│   │   ├── rides/
│   │   │   ├── ui/
│   │   │   │   ├── CreateRide.tsx
│   │   │   │   ├── SearchRides.tsx
│   │   │   │   ├── RideCard.tsx
│   │   │   │   └── RideList.tsx
│   │   │   ├── api/
│   │   │   │   └── ridesApi.ts
│   │   │   ├── model/
│   │   │   │   ├── rideModel.ts
│   │   │   │   └── searchSchema.ts
│   │   │   └── lib/
│   │   │       ├── useRides.ts
│   │   │       └── validateRide.ts
│   │   ├── bookings/
│   │   │   ├── ui/
│   │   │   │   ├── CreateBooking.tsx
│   │   │   │   ├── MyBookings.tsx
│   │   │   │   └── BookingCard.tsx
│   │   │   ├── api/
│   │   │   │   └── bookingsApi.ts
│   │   │   ├── model/
│   │   │   │   ├── bookingModel.ts
│   │   │   │   └── createBookingSchema.ts
│   │   │   └── lib/
│   │   │       ├── useBookings.ts
│   │   │       └── validateBooking.ts
│   │   ├── profiles/
│   │   ├── vehicles/
│   │   └── admin/
│   ├── entities/
│   │   ├── user/
│   │   │   ├── ui/
│   │   │   │   ├── UserAvatar.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   └── model/
│   │   │       └── userModel.ts
│   │   └── ride/
│   │       ├── ui/
│   │       │   └── RideDetails.tsx
│   │       └── model/
│   │           └── rideEntityModel.ts
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Layout.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── config/
│   │       └── constants.ts
│   └── main.tsx
├── server/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthService.js
│   │   │   └── AuthRepository.js
│   │   ├── rides/
│   │   │   ├── RidesService.js
│   │   │   ├── RidesRepository.js
│   │   │   └── RidesController.js
│   │   ├── bookings/
│   │   └── ...
│   ├── routes/                 # Coexist durante transição
│   ├── middleware/
│   └── config/
└── ... (outros diretórios inalterados)
```

---

## Rastreabilidade para o Legado

### Mapeamento de Features

| Feature Nova | Origem no Legado | Dispersão no Legado |
|--------------|------------------|---------------------|
| **auth** | `pages/auth/` + `routes/auth.js` | Concentrado |
| **rides** | `pages/driver/PublishRide.tsx` + `pages/public/SearchResults.tsx` + `routes/rides.js` | 3 pastas |
| **bookings** | `pages/passenger/MyRides.tsx` + `routes/bookings.js` | 2 pastas |
| **profiles** | `pages/profile/` + `pages/driver/DriverProfile.tsx` + `routes/profile.js` | 3 pastas |
| **vehicles** | `pages/driver/` + `routes/vehicles.js` | Espalhado |
| **admin** | `pages/admin/` + `routes/admin.js` | Concentrado |

### Decisões de Agrupamento (não são 1-para-1)

**Por que `rides` inclui busca E criação?**
- **Justificativa:** Am amb as operações operam sobre a mesma entidade (Ride), compartilham validação e regras de negócio, e a transação de CRUD é unitária. Separar faria o painel do motorista fragmentado.

**Por que `bookings` separado de `rides`?**
- **Justificativa:** Bookings é uma transação financeira (transacional, confidencial, com regras próprias). Separação permite evolução independente da lógica de reservas vs. gestão de viagens.

**Por que `vehicles` separado de `profiles`?**
- **Justificativa:** Veículos têm lifecycle próprio (CRUD independente), regras de negócio específicas (capacidade → valeura), e são reutilizáveis em múltiplos contextos (rides, profile, admin).

---

## Próximos Passos

1. **Target Domain Model** — Aggregates, entidades, value objects, eventos
2. **Target Data Model** — DDL, relacionamentos, constraints
3. **Data Migration Plan** — ETL, transformações, validação
4. **Codificação** — Implementar feature-by-feature

---

**Status:** ✅ Fase 2 — Arquitetura concluída  
**Próximo artefato:** `target_domain_model.md`