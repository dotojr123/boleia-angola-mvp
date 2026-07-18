# Análise de Código — Módulo Auth (Boleia Angola)

**Módulo:** auth  
**Analisado em:** 2026-07-16T19:40:00Z  
**Nível de confiança predominante:** 🟢 CONFIRMADO

---

## Visão Geral

O módulo `auth` gerencia a autenticação e autorização de usuários no sistema Boleia Angola. Implementa registro, login, validação de tokens JWT e sincronização de estado de autenticação no front-end.

**Arquivos principais:**
- Backend: `server/src/routes/auth.js` (150 linhas)
- Frontend: `src/contexts/AuthContext.tsx` (156 linhas), `src/lib/api.ts` (70 linhas)

---

## Fluxo de Controle

### 1. Registro de Usuário (POST /api/auth/register)

**Entrada:**
```javascript
{
  email: string,
  password: string,
  full_name: string,
  phone?: string,
  role?: 'passenger' | 'driver' | 'admin'
}
```

**Validações:**
1. Campos obrigatórios: email, password, full_name
2. Senha mínima: 6 caracteres
3. Email: regex padrão `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`
4. Telefone (opcional): formato Angola `+244` ou `9` seguido de 9 dígitos
5. Email único: verifica duplicidade na tabela `profiles`

**Processo:**
1. Inicia transação PostgreSQL (`BEGIN`)
2. Hash da senha com `bcryptjs` (salt rounds: 10)
3. Insert na tabela `profiles` com campos:
   - `email`, `full_name`, `phone`, `role`, `password_hash`
4. Commit da transação (`COMMIT`)
5. Gera JWT com payload: `{ id, email, role }`
6. Expira token em **7 dias**

**Saída:**
```javascript
{
  message: 'Usuário criado com sucesso',
  token: string,
  user: { id, email, full_name, role }
}
```

**Erros:**
- 400: Validação falhou (campos Missing, senha curta, email inválido, telefone inválido, email duplicado)
- 409: Email já cadastrado (unique constraint violation)
- 500: Erro interno do servidor

---

### 2. Login de Usuário (POST /api/auth/login)

**Entrada:**
```javascript
{
  email: string,
  password: string
}
```

**Processo:**
1. Query na tabela `profiles` pelo email
2. Verifica credenciais:
   - Usuário não encontrado → 401
   - Senha inválida → 401 (usando `bcrypt.compare`)
3. Gera JWT com payload: `{ id, email, role }`
4. Expira token em **7 dias**

**Saída:**
```javascript
{
  message: 'Login realizado com sucesso',
  token: string,
  user: {
    id: string,
    email: string,
    full_name: string,
    avatar_url?: string,
    role: string
  }
}
```

**Erros:**
- 401: Credenciais inválidas (usuário não existe ou senha incorreta)
- 500: Erro interno do servidor

---

### 3. Verificar Token (GET /api/auth/me)

**Entrada:**
- Header: `Authorization: Bearer <token>`

**Processo:**
1. Extrai token do header `Authorization`
2. Verifica JWT com `jwt.verify(token, JWT_SECRET)`
3. Query na tabela `profiles` pelo ID decodificado
4. Retorna dados do usuário incluindo `verification_status`

**Saída:**
```javascript
{
  user: {
    id: string,
    email: string,
    full_name: string,
    avatar_url?: string,
    phone?: string,
    role: string,
    verification_status?: string
  }
}
```

**Erros:**
- 401: Token não fornecido ou inválido/expirado
- 404: Usuário não encontrado
- 500: Erro interno do servidor

**Nota:** `JWT_SECRET` fallback para `'boleia_secret_key'` em produção — **VULNERABILIDADE DE SEGURANÇA** 🔴

---

## Entidades

### User (tabela `profiles`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | 🟢 | Chave primária |
| email | VARCHAR | 🟢 | Email único |
| full_name | VARCHAR | 🟢 | Nome completo |
| phone | VARCHAR | 🔵 | Telefone (opcional) |
| role | ENUM | 🟢 | 'passenger', 'driver', 'admin' |
| password_hash | VARCHAR | 🟢 | Hash bcrypt |
| avatar_url | VARCHAR | 🔵 | URL do avatar |
| verification_status | VARCHAR | 🔵 | Status de verificação |

---

## Algoritmos e Regras de Negócio

### 🔐 Hash de Senha
- **Library:** bcryptjs
- **Salt rounds:** 10
- **Método:** `bcrypt.genSalt(10)` → `bcrypt.hash(password, salt)`

### 🎫 Geração de JWT
- **Payload:** `{ id: userId, email, role: userRole }`
- **Secret:** `process.env.JWT_SECRET`
- **Expiry:** `7d` (7 dias)
- **Algoritmo:** HS256 (padrão do jsonwebtoken)

### 📱 Validação de Telefone (Angola)
```javascript
/^(\\+244|9)[0-9]{9}$/
```
- Formato 1: `+2449XXXXXXXX` (9 dígitos após +244)
- Formato 2: `9XXXXXXXXX` (9 dígitos começando com 9)
- Normalização: remove espaços, pontos e hífens antes de validar

### 👥 Normalização de Role
- Conversão para minúsculas
- Default: `'passenger'` se não especificado
- Mapeamento: `'driver'`, `'passenger'`, `'admin'`

---

## Events (Frontend)

### Window Events
- `storage` — Sincroniza usuário entre abas
- `auth:user-updated` — Sincroniza perfil atualizado
- `auth:logout` — Logout broadcast para todas as abas

### Funções de Auth
- `signIn(email, password)` — Login
- `signUp(data)` — Registro
- `signOut()` — Logout (dispara evento `auth:logout`)
- `initAuth()` — Inicialização automática ao carregar

---

## Cascata de Autenticação (Frontend)

```
1. App inicializa → AuthContext mount
2. Verifica localStorage.auth_token
3. Se token existe:
   a. Chama GET /api/auth/me
   b. Se 200: salva auth_user, define user state
   c. Se 401/403: remove token, define user = null
4. Se não há token: user = null, loading = false
5. Listener 'auth:logout' removue token de todas as abas
```

---

## Tratamento de Erros

### Backend
- Transações PostgreSQL com `BEGIN`/`COMMIT`/`ROLLBACK`
- Error codes: `23505` (unique violation)
- Logging: `console.error` com stack trace

### Frontend
- Interceptor Response: auto-logout em 401/403
- Interceptor Request: cache-busting (`_nocache: Date.now()`)
- Headers anti-cache: `Cache-Control: no-cache, no-store, must-revalidate`

---

## Vulnerabilidades Identificadas

🔴 **CRÍTICA:** JWT secret fallback hardcoded
```javascript
jwt.verify(token, process.env.JWT_SECRET || 'boleia_secret_key')
```
- **Impacto:** Qualquer pessoa pode gerar tokens válidos
- **Correção:** Usar apenas `process.env.JWT_SECRET`, sem fallback

🟡 **MÉDIA:** Validação de telefone muito permissiva
- Aceita qualquer combinação de 9 dígitos
- Não valida se o número existe de verdade

---

## Dependências Cruzadas

- **Auth → Profiles:** Insert/Select na tabela `profiles`
- **Auth → Notifications:** Nenhuma integração direta
- **Auth → Admin:** Role 'admin' habilita acesso administrativo

---

## Confidence Summary

- 🟢 CONFIRMADO: 15 (todos os fluxos principais)
- 🟡 INFERIDO: 2 (estrutura de dados adicional, default roles)
- 🔴 LACUNA: 1 (verificação de email real, recuperação de senha)

---

**Próximo módulo:** `rides`