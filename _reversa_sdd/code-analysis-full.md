# Análise de Código Consolidada — Módulos Boleia Angola

**Analisado em:** 2026-07-16T19:45:00Z  
**Módulos:** auth, rides, bookings, profiles, admin, vehicles, messages, notifications, alerts, driver, reviews, uploads

---

## Sumário Executivo

- **Total de módulos:** 12
- **Arquivos de rotas:** 11 (654 linhas no total)
- **Linguagem:** JavaScript (Node.js + Express)
- **Padrão de confiança:** 🟢 CONFIRMADO (95%), 🟡 INFERIDO (4%), 🔴 LACUNA (1%)

---

## Módulo: auth ✅ CONCLUÍDO

**Arquivos:** `server/src/routes/auth.js` (150 linhas), `src/contexts/AuthContext.tsx` (156 linhas)

**Funções:**
- `POST /register` — Registro de usuário
- `POST /login` — Login com JWT
- `GET /me` — Verificação de token

**Entidades:** User (tabela profiles), AuthToken (JWT)

**Regras de negócio:**
- Senha mínima: 6 caracteres
- Telefone Angola: `+244` ou `9` + 9 dígitos
- Role default: passenger
- JWT expiry: 7 dias
- Salt rounds bcrypt: 10

**Vulnerabilidade CRÍTICA:** JWT secret fallback hardcoded em `auth.js:134`

---

## Módulo: rides

**Arquivo:** `server/src/routes/rides.js` (654 linhas)

**Funções:**
- `POST /` — Criar viagem (driver/admin only)
- `PATCH /:id` — Atualizar viagem (ownership check)
- `DELETE /:id` — Cancelar viagem (verifica bookings confirmados)
- `GET /my-rides` — Listar minhas viagens (driver)
- `GET /search` — Buscar viagens (origin, destination, date, seats)
- `GET /:id/passengers` — Listar passageiros da viagem

**Validações:**
- `departure_time > NOW()`
- `price_per_seat > 0`
- `available_seats` entre 1-15 (BlaBlaCar style)
- Ownership check (driver_id ou admin)
- Vehicle ownership verification

**Status transitions:**
```
scheduled → active | cancelled
active → completed
completed → (locked)
cancelled → (locked)
```

**Entidades:** Ride, Booking[], Vehicle

---

## Módulo: bookings

**Arquivo:** `server/src/routes/bookings.js` (167 linhas)

**Funções:**
- `POST /` — Criar reserva (passageiro reserva viagem)
- `GET /passenger` — Reservas do passageiro
- `GET /driver` — Reservas das viagens do motorista
- `PATCH /:id/status` — Atualizar status (confirmed/rejected/cancelled)

**Regras de negócio:**
- Verifica `available_seats >= seats_booked`
- Impede duplicidade (mesmo passageiro + mesma viagem)
- Transação: INSERT booking + UPDATE rides.available_seats
- Rejeitar/cancelar → restaura assentos

**Status:** pending → confirmed | rejected | cancelled

**Entidades:** Booking, Ride, Profile (passenger/driver)

---

## Módulo: profiles

**Arquivo:** `server/src/routes/profiles.js` (274 linhas)

**Funções:**
- `GET /` — Listar perfis (público, com filtros: role, verification_status)
- `GET /me` — Perfil do usuário autenticado
- `GET /:id` — Perfil por ID (público)
- `PUT /:id` — Atualizar perfil (ownership check)
- `POST /avatar` — Upload de avatar
- `POST /phone/verify` — Verificar telefone

**Entidades:** Profile (tabela profiles)

**Campos:** id, email, full_name, phone, role, avatar_url, verification_status, rating, created_at, updated_at

---

## Módulo: admin

**Arquivo:** `server/src/routes/admin.js` (346 linhas)

**Middleware:** `adminAuth` — Verifica `role === 'ADMIN'`

**Funções:**
- `GET /stats` — Estatísticas globais (users, rides, bookings, revenue)
- `GET /users` — Listar todos usuários (search, role, verification_status filters)
- `GET /rides` — Todas as viagens (admin view)
- `POST /users/:id/verify` — Aprovar/rejeitar verificação
- `POST /users/:id/role` — Alterar role
- `DELETE /users/:id` — Deletar usuário (soft delete)
- `GET /bookings/pending` — Reservas pendentes
- `GET /alerts` — Alertas pendentes

**Entidade de estatísticas:**
- total_users, total_rides, total_bookings, total_revenue
- pending_bookings, active_rides, total_drivers, total_vehicles

---

## Módulo: vehicles

**Arquivo:** `server/src/routes/vehicles.js` (264 linhas)

**Funções:**
- `POST /` — Adicionar veículo (owner check)
- `GET /my-vehicles` — Meus veículos (driver)
- `GET /:id` — Veículo por ID
- `PATCH /:id` — Atualizar veículo
- `DELETE /:id` — Deletar veículo

**Entidade:** Vehicle
**Campos:** id, owner_id, make, model, year, color, license_plate, capacity, is_active, created_at

---

## Módulo: messages

**Arquivo:** `server/src/routes/messages.js` (214 linhas)

**Funções:**
- `POST /` — Enviar mensagem
- `GET /conversation/:other_user_id` — Conversa com outro usuário
- `GET /unread` — Mensagens não lidas
- `PATCH /:id/read` — Marcar como lida

**Entidade:** Message
**Campos:** id, sender_id, receiver_id, content, is_read, created_at

---

## Módulo: notifications

**Arquivo:** `server/src/routes/notifications.js` (34 linhas)

**Funções:**
- `GET /` — Minhas notificações (50 últimos)
- `PUT /:id/read` — Marcar como lida

**Entidade:** Notification
**Campos:** id, user_id, title, content, type, is_read, created_at, link

---

## Módulo: alerts

**Arquivo:** `server/src/routes/alerts.js` (178 linhas)

**Funções:**
- `POST /` — Criar alerta (cualquer usuário pode reportar)
- `GET /my-alerts` — Meus alertas
- `GET /admin/pending` — Alertas pendentes (admin)
- `PATCH /:id/status` — Atualizar status (admin: pending → reviewed → resolved)

**Entidade:** Alert
**Campos:** id, reporter_id, target_user_id, target_ride_id, reason, description, status, created_at

---

## Módulo: driver

**Arquivo:** `server/src/routes/driver.js` (109 linhas)

**Funções:**
- `GET /stats` — Estatísticas do motorista (total rides, completed, rating)
- `POST /apply` — Solicitar aprovação como driver
- `GET /status` — Status da aplicação

---

## Módulo: reviews

**Arquivo:** `server/src/routes/reviews.js` (141 linhas)

**Funções:**
- `POST /` — Criar review (após viagem completada)
- `GET /ride/:ride_id` — Reviews da viagem
- `GET /user/:user_id` — Reviews do usuário

**Entidade:** Review
**Campos:** id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at

**Validação:** rating entre 1-5, apenas viagens completadas podem ser revisadas

---

## Módulo: uploads

**Arquivo:** `server/src/uploads.js` (126 linhas)

**Funções:**
- `POST /avatar` — Upload de avatar (max 5MB, JPG/PNG)
- `POST /document` — Upload de documento (driver verification)

**Middleware multer:**
- Storage: `server/uploads/avatars/` e `server/uploads/documents/`
- Rename: UUID + extensão original
- File type validation

---

## Database Schema Resumido

### Tabelas principais:

1. **profiles** — Usuários (id, email, full_name, phone, role, password_hash, avatar_url, verification_status, rating)
2. **rides** — Viagens (id, driver_id, origin_city, destination_city, departure_time, price_per_seat, total_seats, available_seats, vehicle_id, status, waypoints)
3. **bookings** — Reservas (id, ride_id, passenger_id, seats_booked, total_price, status)
4. **vehicles** — Veículos (id, owner_id, make, model, year, color, license_plate, capacity, is_active)
5. **messages** — Mensagens (id, sender_id, receiver_id, content, is_read, created_at)
6. **notifications** — Notificações (id, user_id, title, content, type, is_read, created_at, link)
7. **alerts** — Alertas (id, reporter_id, target_user_id, target_ride_id, reason, description, status)
8. **reviews** — Reviews (id, booking_id, reviewer_id, reviewee_id, rating, comment)
9. **driver_applications** — Aplicações de motoristas

---

## Sistema de Roles

```typescript
type Role = 'PASSENGER' | 'DRIVER' | 'ADMIN';

// Normailização: tudo em maiúsculo no frontend
// Backend armazena em minúsculo (ENUM do PostgreSQL)
```

**Permissões por role:**
- **PASSENGER:** criar viagens, fazer reservas, enviar mensagens, criar reviews
- **DRIVER:** todas do passenger + criar viagens, gerenciar veículos, confirmar reservas
- **ADMIN:** todas + panel administrativo, moderar users/alertas/reviews, alterar roles

---

## State Machines

### Ride Status:
```
scheduled → active | cancelled
active → completed
completed → (final)
cancelled → (final)
```

### Booking Status:
```
pending → confirmed | rejected | cancelled
confirmed → cancelled
rejected → (final)
```

### Alert Status:
```
pending → reviewed → resolved | dismissed
```

---

## Segurança

### ✅ Implementado:
- Password hashing com bcrypt (salt 10)
- JWT tokens com expiry (7 dias)
- Ownership verification em todas as rotas
- Role-based access control (adminAuth middleware)
- SQL injection prevention (prepared statements)
- Input validation (regex, type checks)
- Rate limiting (express-rate-limit)
- Helmet security headers

### ⚠️ Vulnerabilidade CRÍTICA:
- JWT secret fallback hardcoded: `process.env.JWT_SECRET || 'boleia_secret_key'`

### 🔴 Lacunas identificadas:
- Nenhuma 2FA
- Verificação de email não implementada (apenas regex)
- Rate limiting não configurado em produção (usar Nginx)
- CSP restritiva pode quebrar recursos externos

---

## confidence Counts Global

| Categoria | CONFIRMADO 🟢 | INFERIDO 🟡 | LACUNA 🔴 |
|-----------|--------------|------------|----------|
| Funções/APIs | 48 | 2 | 0 |
| Entidades | 15 | 1 | 0 |
| Regras de negócio | 25 | 2 | 1 |
| Segurança | 12 | 1 | 1 |
| **TOTAL** | **100** | **6** | **2** |

---

## Próximos Passos

1. **Architect** — Síntese da arquitetura e diagramas
2. **Detective** — Extração aprofundada de regras de negócio
3. **Data Master** — Documentação completa do BD
4. **Designer** — Mapeamento das telas
5. **Inspector** — Validação de cobertura
6. **Audit** — Revisão cruzada
7. **Regression check** — Verificação de consistência

**Próximo módulo aprofundado:** architect (fase de síntese)