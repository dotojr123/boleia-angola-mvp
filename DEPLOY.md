# Boleia Angola - Documentação de Deploy

Este documento contém as instruções para setup, build e deploy da aplicação Boleia Angola.

## Índice

1. [Visão Geral](#visão-geral)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Setup Local com Docker](#setup-local-com-docker)
4. [Setup Manual](#setup-manual)
5. [API Endpoints](#api-endpoints)
6. [CI/CD Pipeline](#ci-cd-pipeline)
7. [Testes de Integração](#testes-de-integração)

---

## Visão Geral

A arquitetura do Boleia Angola consiste em:

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL 15
- **Autenticação**: JWT + Supabase (opcional)

---

## Variáveis de Ambiente

### Frontend (.env)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3010
GEMINI_API_KEY=your_gemini_api_key
```

### Backend (server/.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boleia_angola
DB_USER=boleia_user
DB_PASSWORD=your_secure_password
PORT=3010
JWT_SECRET=your_jwt_secret_key_change_in_production
```

---

## Setup Local com Docker

### Pré-requisitos

- Docker Desktop instalado
- Docker Compose v2+

### Passos

1. Clone o repositório
2. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
3. Preencha as variáveis de ambiente
4. Execute:
   ```bash
   docker-compose up -d
   ```

### Serviços

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3010
- **Database**: localhost:5432

---

## Setup Manual

### 1. Instalar Dependências

```bash
# Backend
cd server
npm install

# Frontend (na raiz)
npm install
```

### 2. Configurar Banco de Dados

```bash
# Instalar PostgreSQL 15+
# Criar banco de dados
createdb -U postgres boleia_angola

# Rodar migrations
psql -U postgres -d boleia_angola -f full_migration_v3.sql
```

### 3. Rodar Backend

```bash
cd server
npm run dev
# ou
npm start
```

### 4. Rodar Frontend

```bash
npm run dev
```

---

## API Endpoints

### Base URL: `http://localhost:3010/api`

#### Auth

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Login de usuário |

#### Rides (Viagens)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/rides` | Listar viagens (com filtros) |
| GET | `/rides/:id` | Detalhes de uma viagem |

#### Bookings (Reservas)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/bookings` | Listar reservas do usuário |
| GET | `/bookings/:id` | Detalhes de uma reserva |
| POST | `/bookings` | Criar nova reserva |
| PATCH | `/bookings/:id/status` | Atualizar status da reserva |

#### Profiles (Perfis)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/profiles/:id` | Buscar perfil por ID |
| PUT | `/profiles/:id` | Atualizar perfil |

#### Vehicles (Veículos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/vehicles` | Listar veículos do usuário |
| POST | `/vehicles` | Adicionar veículo |
| DELETE | `/vehicles/:id` | Remover veículo |

#### Admin

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/stats` | Estatísticas do sistema |
| GET | `/admin/verifications` | Verificações pendentes |
| PATCH | `/admin/profiles/:id/verify` | Aprovar/recusar perfil |

---

## CI/CD Pipeline

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd server && npm install
      
      - name: Install Frontend Dependencies
        run: npm install
      
      - name: Run Tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Frontend
        run: npm run build
      
      - name: Build Docker Images
        run: docker-compose build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Add deployment steps here
          echo "Deploy completed"
```

---

## Testes de Integração

### Backend ↔ Frontend

1. **Testar conexão API**:
   ```bash
   curl http://localhost:3010/api/
   # Expected: {"message": "Boleia Angola API v1.0", "status": "ok"}
   ```

2. **Testar registro de usuário**:
   ```bash
   curl -X POST http://localhost:3010/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@boleia.com","password":"senha123","full_name":"Teste User","phone":"+244999999999"}'
   ```

3. **Testar login**:
   ```bash
   curl -X POST http://localhost:3010/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@boleia.com","password":"senha123"}'
   ```

### API ↔ Banco de Dados

```bash
# Verificar conexão com banco
psql -U boleia_user -d boleia_angola -c "SELECT count(*) FROM profiles;"
```

---

## Troubleshooting

### Erro: "Connection refused" no banco

Verifique se o PostgreSQL está rodando:
```bash
docker ps | grep postgres
# ou
pg_isready -h localhost -p 5432
```

### Erro: "JWT_SECRET not defined"

Certifique-se de que o arquivo `.env` do backend está configurado corretamente.

### Erro: "Port already in use"

Altere a porta no `.env`:
```env
PORT=3011
```

---

## Produção

### Variáveis de Produção

- Use um `.env` específico para produção
- Nunca commite senhas ou chaves secretas
- Use serviços como AWS Secrets Manager ou Azure Key Vault

### Deploy em Servidor

1. Instale Docker e Docker Compose
2. Clone o repositório
3. Configure `.env` com variáveis de produção
4. Execute:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Contato

Para dúvidas ou problemas, abra uma issue no repositório.
