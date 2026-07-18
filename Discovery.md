# Discovery - Boleia Angola

## 1. Visão e Problema

**Visão:** Plataforma de caronas compartilhadas em Angola que conecta motoristas e passageiros para viagens interurbanas seguras e acessíveis.

**Problema:** Dificuldade de locomoção entre cidades angolanas com transporte público limitado e caro.

**Público-alvo:**
- Motoristas que fazem viagens regulares e têm assentos disponíveis
- Passageiros que buscam alternativa mais barata que transporte privado

## 2. Funcionalidades Core

### Motorista
- Cadastro de veículo
- Publicação de viagens (origem, destino, data, preço, assentos)
- Gestão de reservas (aceitar/rejeitar)
- Chat com passageiros

### Passageiro
- Busca de viagens (origem, destino, data)
- Reserva de assentos
- Chat com motorista
- Histórico de viagens

### Admin
- Gestão de usuários
- Monitoramento de viagens
- Aprovação de cadastros

## 3. Monetização

- Modelo: Comissão por viagem realizada (30%)
- Pagamento: Integrado na plataforma (Kwanza)
- Futuro: Planos premium para motoristas

## 4. Stack Técnica

**Frontend:**
- React 19 + Vite + TypeScript
- Tailwind CSS
- Framer Motion
- React Router

**Backend:**
- Node.js + Express
- PostgreSQL 15
- JWT para autenticação
- Multer para uploads

**Infra:**
- Docker para desenvolvimento
- Vite para dev server

## 5. Status Atual

**Concluído:**
- [x] Autenticação JWT com roles (DRIVER, PASSENGER, ADMIN)
- [x] CRUD de viagens
- [x] CRUD de reservas
- [x] Sistema de mensagens (polling)
- [x] Dashboards por perfil
- [x] Migração Supabase → PostgreSQL nativo

**Em Validação:**
- [ ] Fluxo completo do motorista (veículo → publicação → listagem)
- [ ] Fluxo completo do passageiro (busca → reserva → confirmação)
- [ ] Integração admin → gestão de usuários

**Pendências Críticas:**
1. Testes de automação falhando (rotas e seletores)
2. Validação de sincronização em tempo real
3. Tratamento de erros de API

## 6. Referências

- API: http://localhost:3010
- Frontend: http://localhost:3002
- Credenciais teste:
  - Driver: teste_driver@boleia.com / senha123
  - Passageiro: passageiro_teste@boleia.com / senha123
  - Admin: admin@boleia.com / admin123
