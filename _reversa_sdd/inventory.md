# Inventário do Projeto — Boleia Angola

**Gerado em:** 2026-07-16T19:40:00Z  
**Pasta do projeto:** /root/boleia-angola

## Resumo

- **Total de arquivos:** 181 (excluindo node_modules, .git, build artifacts)
- **Linguagem principal:** TypeScript/TSX
- **Arquitetura:** Full-stack (React + Express)
- **Banco de dados:** PostgreSQL

## Estrutura de Pastas

```
boleia-angola/
├── src/                    # Frontend React
│   ├── components/        # Componentes UI reutilizáveis
│   ├── contexts/          # Contextos React (Auth, Notifications)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários (api.ts)
│   ├── models/            # Tipos/Models
│   ├── pages/             # Páginas por role
│   │   ├── admin/        # Painel administrativo
│   │   ├── auth/         # Login/Register
│   │   ├── driver/       # Painel do motorista
│   │   ├── passenger/    # Painel do passageiro
│   │   ├── profile/      # Perfil do usuário
│   │   └── public/       # Páginas públicas
│   └── test/              # Tests setup
├── server/                # Backend Express
│   ├── src/
│   │   ├── config/       # Configuração DB
│   │   ├── middleware/   # Auth, rate-limit
│   │   ├── routes/       # Rotas API
│   │   └── uploads/      # Arquivos upload
│   ├── tests/            # Tests backend
│   └── uploads/          # uploads públicos
├── migrations/            # Migrations SQL
├── nginx/                # Configuração Nginx
├── .github/workflows/    # CI/CD
├── scripts/              # Scripts utilitários
├── tests/                # E2E + Integration tests
└── triggers/             # Database triggers
```

## Tecnologias Identificadas

### Frontend (React + Vite)
- **React** — UI library
- **React Router** — Routing
- **Axios** — HTTP client
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Vitest + Playwright** — Testing

### Backend (Node.js + Express)
- **Express** — Web framework
- **PostgreSQL** (pg) — Database
- **jsonwebtoken** — JWT authentication
- **bcryptjs** — Password hashing
- **multer** — File uploads
- **cors** — CORS handling
- **helmet** — Security headers
- **morgan** — Logging
- **express-rate-limit** — Rate limiting
- **Jest + Supertest** — Testing

### Infraestrutura
- **Nginx** — Reverse proxy
- **PM2** — Process manager
- **Docker** — Containerização (Dockerfile presente)

## Módulos Identificados

1. **auth** — Autenticação (login, register, JWT)
2. **rides** — Crie e gerencie corridas
3. **bookings** — Reserva de corridas
4. **profiles** — Perfis de usuário
5. **drivers** — Gestão de motoristas
6. **vehicles** — Veículos
7. **messages** — Mensagens entre usuários
8. **notifications** — Notificações
9. **alerts** — Alertas de segurança
10. **admin** — Painel administrativo
11. **reviews** — Avaliações
12. **uploads** — Upload de arquivos (avatars, documentos)

## Entrada Principal

- **Frontend:** `src/main.tsx` → `App.tsx`
- **Backend:** `server/src/index.js`

## Configuração

- **Ambiente:** `.env` (dev), `.env.production` (prod)
- **TypeScript:** `tsconfig.json`
- **Build:** Vite (frontend), nodemon (backend)
- **Deploy:** Nginx + PM2

## Banco de Dados

- **Tipo:** PostgreSQL
- **Migrations:** Pasta `migrations/` + arquivo `auth_migration.sql`
- **Schema:** `boleia_angola` (com 16 tabelas)

## Testes

- **Unitários:** Vitest (frontend), Jest (backend)
- **E2E:** Playwright
- **Arquivos de teste:** ~15 arquivos

## Integrações Externas

- Nenhuma identificação direta no código (API própria)

## Notes

- Sistema similar ao BlaBlaCar (rodovias angolanas)
- Suporte a 3 roles: PASSENGER, DRIVER, ADMIN
- Autenticação via JWT
- Upload de avatares e documentos
- Notificações em tempo real (polling 30s)