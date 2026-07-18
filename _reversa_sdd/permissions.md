# Matriz de Permissões — RBAC — Boleia Angola

**Gerado em:** 2026-07-16T20:15:00Z  
**Agente:** Detective  
**Nível de documentação:** essencial

---

## Visão Geral

Este documento descreve o sistema de controle de acesso baseado em roles (RBAC - Role-Based Access Control) do Boleia Angola. Define papéis de usuário, permissões por role e regras de ownership.

---

## Papéis do Sistema (Roles)

| Role | Descrição | Número Típico | Pode Criar Viagens | Pode Gerenciar Users |
|------|-----------|---------------|-------------------|---------------------|
| `PASSENGER` | Usuário comum que busca caronas | Maioria dos users | ❌ Não | ❌ Não |
| `DRIVER` | Motorista que oferece caronas | Users ativos | ✅ Sim | ❌ Não |
| `ADMIN` | Administrador da plataforma | 1-5 users | ✅ Sim | ✅ Sim |

### Observações Importantes

⚠️ **Normalização:** Frontend usa maiúsculo (`PASSENGER`, `DRIVER`, `ADMIN`)  
⚠️ **Armazenamento:** Backend armazena em minúsculo no ENUM PostgreSQL (`'passenger'`, `'driver'`, `'admin'`)  
⚠️ **Role default:** Novo usuário registra como `passenger` automaticamente

---

## Hierarquia de Permissões

```
ADMIN (superuser)
  │
  ├─> Todas permissões do DRIVER
  │     │
  │     └─> Todas permissões do PASSENGER
  │
  └─> Permissões administrativas exclusivas
```

**Princípio:** Permissões são **acumulativas** — role superior herda todas permissões da role inferior.

---

## Matriz de Permissões Detalhada

### 🟢 Autenticação e Account

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Registrar conta | ✅ | ✅ | ✅ | 🟢 |
| Login | ✅ | ✅ | ✅ | 🟢 |
| Verificar token (GET /me) | ✅ | ✅ | ✅ | 🟢 |
| Editar próprio perfil | ✅ | ✅ | ✅ | 🟢 |
| Upload avatar | ✅ | ✅ | ✅ | 🟢 |
| Verificar telefone | ✅ | ✅ | ✅ | 🟢 |
| Deletar própria conta | ❌ | ❌ | ❌ (admin pode deletar outros) | 🟢 |

### 🟢 Viagens (Rides)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Buscar viagens (GET /search) | ✅ | ✅ | ✅ | 🟢 |
| Ver detalhes de viagem | ✅ | ✅ | ✅ | 🟢 |
| Criar viagem (POST /) | ❌ | ✅ | ✅ | 🟢 |
| Editar própria viagem (PATCH /:id) | ❌ | ✅ (owner) | ✅ | 🟢 |
| Cancelar própria viagem (DELETE /:id) | ❌ | ✅ (owner, sem bookings) | ✅ | 🟢 |
| Listar minhas viagens (GET /my-rides) | ❌ | ✅ | ✅ (admin view) | 🟢 |
| Listar passageiros da viagem | ❌ | ✅ (owner) | ✅ | 🟢 |

### 🟢 Reservas (Bookings)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Criar reserva (POST /) | ✅ | ✅ (própria) | ✅ | 🟢 |
| Ver minhas reservas (GET /passenger) | ✅ | ❌ | ✅ | 🟢 |
| Ver reservas dos meus rides (GET /driver) | ❌ | ✅ | ✅ | 🟢 |
| Alterar status reserva | ❌ | ✅ (sua viagem) | ✅ | 🟢 |
| Cancelar reserva | ❓ | ❓ | ✅ | 🟡 (inferido) |

### 🟢 Perfis (Profiles)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Listar perfis (GET /) | ✅ (público) | ✅ (público) | ✅ (todos) | 🟢 |
| Ver próprio perfil (GET /me) | ✅ | ✅ | ✅ | 🟢 |
| Ver perfil de outro (GET /:id) | ✅ | ✅ | ✅ | 🟢 |
| Editar próprio perfil (PUT /:id) | ✅ | ✅ | ❌ (apenas admin edita outros) | 🟢 |
| Aprovar/rejeitar verificação | ❌ | ❌ | ✅ | 🟢 |
| Alterar role de usuário | ❌ | ❌ | ✅ | 🟢 |
| Deletar usuário (soft delete) | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Veículos (Vehicles)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Adicionar veículo (POST /) | ❌ | ✅ (owner) | ✅ | 🟢 |
| Listar meus veículos (GET /my-vehicles) | ❌ | ✅ | ✅ | 🟢 |
| Ver veículo por ID (GET /:id) | ✅ (público) | ✅ | ✅ | 🟢 |
| Editar próprio veículo (PATCH /:id) | ❌ | ✅ (owner) | ✅ | 🟢 |
| Deletar próprio veículo (DELETE /:id) | ❌ | ✅ (owner) | ✅ | 🟢 |
| Verificar veículo | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Mensagens (Messages)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Enviar mensagem (POST /) | ✅ | ✅ | ✅ | 🟢 |
| Ver conversa com outro usuário | ✅ | ✅ | ✅ | 🟢 |
| Ver mensagens não lidas (GET /unread) | ✅ | ✅ | ✅ | 🟢 |
| Marcar como lida (PATCH /:id/read) | ✅ | ✅ | ✅ | 🟢 |
| Apagar mensagem | ❓ | ❓ | ✅ | 🟡 (inferido) |

### 🟢 Notificações (Notifications)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Ver minhas notificações (GET /) | ✅ | ✅ | ✅ | 🟢 |
| Marcar notificação como lida | ✅ | ✅ | ✅ | 🟢 |
| Criar notificação (system) | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Alertas (Alerts)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Criar alerta (POST /) | ✅ | ✅ | ✅ | 🟢 |
| Ver meus alertas (GET /my-alerts) | ✅ | ✅ | ✅ | 🟢 |
| Ver alertas pendentes (GET /admin/pending) | ❌ | ❌ | ✅ | 🟢 |
| Alterar status de alerta | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Reviews (Avaliações)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Criar review (POST /) | ✅ | ✅ | ❓ | 🟢 (ambos podem avaliar) |
| Ver reviews da minha viagem | ❌ | ✅ (owner) | ✅ | 🟢 |
| Ver reviews de um usuário | ✅ | ✅ | ✅ | 🟢 |
| Moderar/delete review | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Driver Application (Solicitação para Motorista)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Solicitar tornar-se driver (POST /apply) | ✅ | ❌ (já driver) | ❌ | 🟢 |
| Ver status da aplicação (GET /status) | ✅ | ❌ | ✅ | 🟢 |
| Ver estatísticas de driver | ❌ | ✅ | ✅ | 🟢 |
| Aprovar/rejeitar aplicação | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Admin Panel (Estatísticas e Moderacao)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Ver Estatísticas globais (GET /stats) | ❌ | ❌ | ✅ | 🟢 |
| Listar todos usuários (GET /users) | ❌ | ❌ | ✅ | 🟢 |
| Buscar usuários (filtros role, verification) | ❌ | ❌ | ✅ | 🟢 |
| Listar todas viagens (admin view) | ❌ | ❌ | ✅ | 🟢 |
| Listar reservas pendentes | ❌ | ❌ | ✅ | 🟢 |
| Moderar reviews | ❌ | ❌ | ✅ | 🟢 |

### 🟢 Uploads (Arquivos)

| Ação | PASSENGER | DRIVER | ADMIN | Confianza |
|------|-----------|--------|-------|-----------|
| Upload avatar (POST /avatar) | ✅ | ✅ | ✅ | 🟢 |
| Upload documento (POST /document) | ❌ | ✅ (driver verification) | ✅ | 🟢 |

---

## Regras de Ownership (Posse)

### Princípio Fundamental

**Usuário só pode manipular recursos que são de sua propriedade, a menos que seja ADMIN.**

### Regras Específicas

| Recurso | Owner | Permitido editar/deletar |
|---------|-------|--------------------------|
| Viagem (`rides`) | `driver_id` | Driver proprietário OU admin |
| Reserva (`bookings`) | `passenger_id` (para cancelar) + `ride.driver_id` (para confirmar/rejectar) | Passageiro reservas ou motorista da viagem OU admin |
| Perfil (`profiles`) | `id` (próprio) | Apenas próprio OU admin |
| Veículo (`vehicles`) | `owner_id` | Apenas proprietário OU admin |
| Mensagem (`messages`) | `sender_id` ou `receiver_id` | Apenas participantes da conversa OU admin |
| Alerta (`alerts`) | `reporter_id` | Apenas reporter OU admin |
| Review (`reviews`) | `reviewer_id` | Apenas reviewer OU admin |

### Implementação no Código

**Middleware de autenticação:**
```javascript
// server/src/middleware/auth.js
const auth = (req, res, next) => {
    const token = ...; //_extract token
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // { id, role, email, ... }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};
```

**Check de ownership padrão:**
```javascript
// Exemplo: PATCH /rides/:id
const rideCheck = await db.query(
    'SELECT driver_id FROM rides WHERE id = $1',
    [id]
);

if (rideCheck.rows[0].driver_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão para editar esta viagem' });
}
```

**Check de role:**
```javascript
// Exemplo: POST /rides (criar viagem)
const userRole = req.user.role?.toLowerCase();
if (userRole !== 'driver' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Apenas motoristas ou admins podem criar viagens' });
}
```

---

## Guardas de Segurança

### 🟢 Implementadas

| Guarda | Descrição | Localização |
|--------|-----------|-------------|
| JWT verification | Token necessário para rotas protegidas | `middleware/auth.js` |
| Role check | Verifica `user.role` antes de ação | Todas rotas |
| Ownership check | Verifica `resource.owner_id === user.id` | CRUDs |
| SQL injection prevention | Prepared statements (pg pool) | `config/db.js` |
| Input validation | Regex, type checks, required fields | Cada route |
| Rate limiting | express-rate-limit | `middleware/rate-limit.js` |
| Helmet headers | Security headers | `server/src/index.js` |
| Hash password | bcrypt (salt 10) | `routes/auth.js` |

### ⚠️ Vulnerabilidades Conhecidas

| ID | Vulnerabilidade | Severidade | Localização |
|----|-----------------|------------|-------------|
| VULN-001 | JWT secret fallback hardcoded | CRÍTICO | `routes/auth.js:134` |

**Código vulnerável:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'boleia_secret_key';
```

**Impacto:** Qualquer pessoa conhecendo o segredo pode gerar tokens válidos.  
**Correção:** Remover fallback, exigir `process.env.JWT_SECRET` definida.

### 🔴 Lacunas de Segurança

| Lacuna | Descrição |
|--------|-----------|
| LACK-001 | Sem 2FA (fator duplo) |
| LACK-002 | Email verification não funciona (apenas regex) |
| LACK-003 | Rate limiting em production depende de Nginx |
| LACK-004 | CSP restritiva pode quebrar recursos externos |

---

## Escopo de Permissões por Contexto

### Contexto: Busca Viagens

**Qualquer usuário autenticado** (passenger, driver, admin) pode buscar viagens.  
**NÃO requer role específica.**

### Contexto: Criar Viagem

**Requisito:** `user.role === 'driver' || user.role === 'admin'`  
**Additional:** Se `vehicle_id` fornecido → `vehicle.owner_id === user.id || user.role === 'admin'`

### Contexto: Editar Viagem

**Requisito:** `ride.driver_id === user.id || user.role === 'admin'`

### Contexto: Criar Reserva

**Requisito:** Usuário autenticado (qualquer role)  
**Constraints:** `ride.available_seats >= seats`, no duplicate booking

### Contexto: Confirmar/Rejeitar Reserva

**Requisito:** `booking.ride.driver_id === user.id || user.role === 'admin'`

### Contexto: Moderar Usuários

**Requisito:** `user.role === 'admin'`

---

## Vertical Privilege Escalation

**Definição:** Usuário tenta acessar funcionalidade de role superior.

**Exemplo:** Passenger tenta criar viagem → BLOCKED com 403 Forbidden  
**Exemplo:** Driver tenta aprovar usuário → BLOCKED com 403 Forbidden

**Prevenção:** Todos endpoints com permissões especiais verificam role ANTES de execução.

---

## Horizontal Privilege Escalation

**Definição:** Usuário tenta acessar/editar recurso de OUTRO usuário da mesma role.

**Exemplo:** Driver A tenta editar viagem de Driver B → BLOCKED com 403 Forbidden  
**Exemplo:** User A tenta deletar perfil de User B → BLOCKED com 403 Forbidden

**Prevenção:** CRUDs verificam ownership (`resource.owner_id === user.id`).

---

## Summary Estatístico

| Categoria | Totais |
|-----------|--------|
| Roles definidas | 3 |
| Resutos protegidos | 12 |
| Endpoints com role check | ~25 |
| Endpoints com ownership check | ~20 |
| Vulnerabilidades conhecidas | 1 (CRÍTICO) |
| Lacunas de segurança | 4 |

---

**Documento gerado por:** Revisa Detective  
**Confiança escalonada:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA