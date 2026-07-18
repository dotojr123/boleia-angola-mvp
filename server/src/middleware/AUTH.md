# Middleware de Autenticação — Boleia Angola

**Local:** `server/src/middleware/auth.ts`  
**Versão:** 1.0.0  
**Última atualização:** 2026-07-17T00:50:00Z

---

## Funções Principais

### `requireAuth`
Verifica JWT e anexa usuário ao request.

```typescript
app.get('/api/rides', requireAuth, (req: AuthenticatedRequest, res, next) => {
  console.log(req.user); // { id: string, email: string, role: UserRole }
});
```

**Comportamento:**
- ❌ Sem token → 401 `NO_TOKEN`
- ✅ Token inválido → 403 `INVALID_TOKEN`
- ✅ Token expirado → 401 `TOKEN_EXPIRED`
- ✅ Token válido → anexa `req.user` e chama `next()`

---

### `requireRole(...roles)`
Verifica se usuário tem uma das roles permitidas.

```typescript
app.get('/api/admin/users', requireAuth, requireRole('admin'), adminHandler);
app.post('/api/rides', requireAuth, requireRole('driver', 'admin'), createRideHandler);
```

**Comportamento:**
- ❌ User não autenticado → 401
- ❌ Role insuficiente → 403 com roles permitidas
- ✅ Role válida → `next()`

---

### `requireAdmin`
Atalho para `requireRole('admin')`.

```typescript
app.delete('/api/users/:id', requireAuth, requireAdmin, deleteAdminHandler);
```

---

### `requireDriver`
Atalho para `requireRole('driver', 'admin')`.

```typescript
app.post('/api/rides', requireAuth, requireDriver, createRideHandler);
```

---

### `requireOwnership(resourceIdField, userIdField)`
Verifica se usuário é dono do recurso.

```typescript
app.patch('/api/rides/:id', requireAuth, requireOwnership('id', 'owner_id'), updateRideHandler);
```

---

### `checkPermission(userRole, action, resourceType)`
Utility para verificar permissões complexas.

```typescript
if (!checkPermission(user.role, 'delete', 'ride')) {
  return res.status(403).json({ error: 'Permissão negada' });
}
```

**Permissões por Role:**
| Role | create | read | update | delete | moderate |
|------|--------|------|--------|--------|----------|
| passenger | booking | tudo | próprio perfil | booking | - |
| driver | ride, vehicle, booking, review | tudo | própria ride/vehicle | própria ride | - |
| admin | tudo | tudo | tudo | tudo | tudo |

---

### `generateToken(userId, email, role)`
Cria JWT com expiry 7 dias.

```typescript
const token = generateToken(user.id, user.email, user.role);
```

---

### `validateToken(token)`
Verifica token sem anexar ao request.

```typescript
const { valid, user, error } = validateToken(token);
if (!valid) {
  return res.status(401).json({ error });
}
```

---

## Regras de Negócio Implementadas

### R7 — Autenticação
- ✅ R7.1: Senha mínima 6 caracteres (constante no ProfileValidator)
- ✅ R7.2: Telefone Angola (+244 ou 9XXXXXXXX)
- ✅ R7.3: Role default no registro: passenger
- ✅ R7.4: JWT expiry: 7 dias
- ✅ R7.5: Salt rounds bcrypt: 10
- ✅ R7.6: Todos endpoints excepto (register, login, me) requerem JWT

### R8 — Permissões (RBAC)
- ✅ R8.1: PASSENGER — criar reservas, enviar mensagens, criar reviews
- ✅ R8.2: DRIVER — todas do passenger + criar viagens, gerenciar veículos
- ✅ R8.3: ADMIN — todas + moderar usuários, alertas, reviews, alterar roles
- ✅ R8.4: Ownership check em recursos editáveis

---

## Tipos TypeScript

```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole; // 'passenger' | 'driver' | 'admin'
    iat?: number;
    exp?: number;
  };
}

type UserRole = 'passenger' | 'driver' | 'admin';
```

---

## Erros Retornados

| Código | HTTP | Descrição |
|--------|------|-----------|
| NO_TOKEN | 401 | Token não fornecido |
| TOKEN_EXPIRED | 401 | Token expirado |
| INVALID_TOKEN | 403 | Token inválido |
| AUTH_REQUIRED | 401 | Autenticação necessária |
| INSUFFICIENT_ROLE | 403 | Role insuficiente |
| NOT_OWNER | 403 | Não é dono do recurso |
| MISSING_RESOURCE_ID | 400 | ID do recurso faltando |

---

## Uso nos Roteiros

```typescript
import { requireAuth, requireAdmin, requireDriver, requireOwnership } from './middleware/auth';

// Endpoint público
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);

// Endpoint autenticado (qualquer role)
app.get('/api/profiles/me', requireAuth, getProfileHandler);

// Endpoint apenas para drivers
app.post('/api/rides', requireAuth, requireDriver, createRideHandler);

// Endpoint apenas para admin
app.get('/api/admin/stats', requireAuth, requireAdmin, statsHandler);

// Endpoint com ownership check
app.patch('/api/rides/:id', requireAuth, requireOwnership(), updateRideHandler);
```

---

**Arquivo:** `/root/boleia-angola/server/src/middleware/auth.ts`