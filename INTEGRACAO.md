# Guia de Integração - Boleia Angola

Este documento destina-se às equipes de Backend, Frontend e Database para garantir uma integração suave.

---

## Checklist de Integração

### Equipe Backend

- [ ] Variáveis de ambiente configuradas no `server/.env`
- [ ] Banco de dados acessível e migrations rodadas
- [ ] API rodando em http://localhost:3010
- [ ] Endpoints de auth funcionando (register, login)
- [ ] Middleware de JWT validando tokens
- [ ] CORS configurado para aceitar requisições do frontend

### Equipe Frontend

- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] `VITE_API_URL` apontando para o backend correto
- [ ] Componentes de login/registro funcionando
- [ ] Interceptador de requisições adicionando JWT token
- [ ] Tratamento de erros de API implementado

### Equipe Database

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `boleia_angola` criado
- [ ] Migrations rodadas com sucesso
- [ ] Índices criados para performance
- [ ] Policies de RLS (Row Level Security) ativas

---

## Fluxos Principais para Teste

### 1. Registro de Usuário

```
Frontend → POST /api/auth/register → Backend → DB Insert
```

**Teste:**
```bash
curl -X POST http://localhost:3010/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@boleia.com",
    "password": "senha123",
    "full_name": "Teste User",
    "phone": "+244999999999"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Usuário criado com sucesso",
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "teste@boleia.com",
    "full_name": "Teste User"
  }
}
```

---

### 2. Login

```
Frontend → POST /api/auth/login → Backend → DB Select → JWT Generate
```

**Teste:**
```bash
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@boleia.com",
    "password": "senha123"
  }'
```

---

### 3. Criar Viagem (Ride)

```
Frontend → POST /api/rides → Backend → DB Insert
```

**Requisito:** Token JWT válido

---

### 4. Listar Viagens

```
Frontend → GET /api/rides?origin=...&destination=... → Backend → DB Select
```

---

### 5. Reservar Vaga

```
Frontend → POST /api/bookings → Backend → DB Insert (ride + booking)
```

---

## Configuração de Rede

### Desenvolvimento Local

```:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│  (Port 3000)│     │ (Port 3010) │     │ (Port 5432) │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Docker Compose

```yaml
# Frontend se conecta ao backend via: http://backend:3010
# Backend se conecta ao db via: db:5432
```

---

## Solução de Problemas

### Erro: CORS

**Sintoma:** Erro de CORS no console do browser

**Solução:**
```javascript
// No backend (server/src/index.js)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

---

### Erro: Connection Refused

**Sintoma:** ECONNREFUSED ao conectar no banco

**Solução:**
- Verificar se PostgreSQL está rodando
- Confirmar host/port no `.env`
- Em Docker, usar `db` como host, não `localhost`

---

### Erro: Token Inválido

**Sintoma:** 401 Unauthorized

**Solução:**
- Verificar se JWT_SECRET é igual no backend
- Confirmar se token está sendo enviado no header: `Authorization: Bearer <token>`

---

## Contatos das Equipes

| Equipe | Responsável | Canal |
|--------|-------------|-------|
| Backend | Tech Lead | #backend |
| Frontend | Tech Lead | #frontend |
| Database | DBA | #database |

---

## Próximos Passos

1. Cada equipe deve validar seu checklist
2. Realizar testes de integração entre serviços
3. Reportar issues no repositório
4. Agendar deploy de homologação
