<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Boleia Angola

Sistema de caronas e transporte compartilhado para Angola.

## Documentação

| Arquivo | Descrição |
|---------|-----------|
| [DEPLOY.md](DEPLOY.md) | Instruções de deploy, setup e API endpoints |
| [INTEGRACAO.md](INTEGRACAO.md) | Guia de integração entre equipes |
| [SETUP_MOTORISTA_ADMIN.md](SETUP_MOTORISTA_ADMIN.md) | Setup de motoristas e admin |

## Tecnologias

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL 15
- **Autenticação**: JWT
- **Containerização**: Docker + Docker Compose

## Setup Rápido

### 1. Clone e instale dependências

```bash
git clone <repo>
npm install
cd server && npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
cp server/.env.example server/.env
```

### 3. Subir com Docker Compose

```bash
docker-compose up -d
```

Acesse:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3010
- Database: localhost:5432

## Estrutura do Projeto

```
boleia-angola/
├── src/                 # Frontend React
├── server/              # Backend API
│   ├── src/
│   │   ├── routes/      # Endpoints da API
│   │   ├── config/      # Configuração do banco
│   │   └── middleware/  # Auth, validações
│   └── .env.example
├── .env.example         # Frontend env template
├── docker-compose.yml   # Docker config
├── DEPLOY.md            # Guia completo de deploy
└── INTEGRACAO.md        # Guia para equipes
```

## Scripts

```bash
# Desenvolvimento
npm run dev          # Frontend (Vite)
npm run server:dev   # Backend (nodemon)

# Build
npm run build        # Frontend build

# Docker
docker-compose up    # Local dev
docker-compose -f docker-compose.prod.yml up  # Produção
```

## API Endpoints

| Endpoint | Descrição |
|----------|-----------|
| POST `/api/auth/register` | Registro de usuário |
| POST `/api/auth/login` | Login |
| GET `/api/rides` | Listar viagens |
| POST `/api/bookings` | Criar reserva |
| GET `/api/profiles/:id` | Buscar perfil |
| GET `/api/admin/stats` | Estatísticas (admin) |

Veja [DEPLOY.md](DEPLOY.md) para documentação completa da API.

## Equipe

- Backend: Node.js/Express
- Frontend: React/Vite
- Database: PostgreSQL

## Licença

Proprietário - Boleia Angola
