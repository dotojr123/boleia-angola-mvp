# 📅 FASE 2 - Cronograma e Checklist Completo

> **Objetivo:** Transformar o Boleia Angola em um aplicativo profissional de nível mundial
> **Duração Estimada:** 3-4 semanas (15-20 dias úteis)
> **Status:** Não Iniciado

---

## 📊 Visão Geral do Cronograma

| Semana | Foco Principal | Entregáveis Críticos |
|--------|---------------|---------------------|
| **Semana 1** | Backend + DB | CRUD completo de rides, bookings, vehicles |
| **Semana 2** | Frontend + Integração | Dashboards funcionais, busca em tempo real |
| **Semana 3** | Testes + Polimento | Testes E2E, performance, UX |
| **Semana 4** | Deploy + Monitoramento | Produção, logs, alertas |

---

## 🔹 SEMANA 1: Backend + DB (Dia 1-5)

### Dia 1: Backend - CRUD de Viagens (Rides)

#### Backend Developer
- [ ] **P0** - `POST /api/rides` - Criar viagem
  - [ ] Validar campos obrigatórios (origin, destination, departure_time, price_per_seat, available_seats)
  - [ ] Verificar se usuário é motorista
  - [ ] Gerar ID único (UUID)
  - [ ] Retornar viagem criada com status "scheduled"
  
- [ ] **P0** - `PATCH /api/rides/:id` - Atualizar viagem
  - [ ] Validar propriedade (apenas dono ou admin)
  - [ ] Atualizar campos permitidos
  - [ ] Validar mudança de status (scheduled → active → completed)
  - [ ] Atualizar disponível seats

- [ ] **P0** - `DELETE /api/rides/:id` - Cancelar/remover viagem
  - [ ] Soft delete (status = cancelled)
  - [ ] Validar se há bookings confirmados
  - [ ] Notificar passageiros afetados

- [ ] **P1** - `GET /api/rides/my-rides` - Minhas viagens (motorista)
  - [ ] Filtrar por driver_id
  - [ ] Incluir bookings relacionados
  - [ ] Ordenar por departure_time

- [ ] **P1** - `GET /api/rides/:id/passengers` - Passageiros da viagem
  - [ ] Listar bookings confirmados
  - [ ] Incluir dados do passageiro

#### Database Engineer
- [ ] **P0** - Criar trigger `before_insert_rides`
  - [ ] Validar departure_time > NOW()
  - [ ] Validar price_per_seat > 0
  - [ ] Validar available_seats > 0

- [ ] **P0** - Criar trigger `update_available_seats`
  - [ ] Atualizar seats quando booking for criado/cancelado

- [ ] **P1** - Criar função `get_ride_stats(ride_id)`
  - [ ] Total arrecadado
  - [ ] Passageiros confirmados
  - [ ] Assentos disponíveis

### Dia 2: Backend - CRUD de Reservas (Bookings)

#### Backend Developer
- [ ] **P0** - `POST /api/bookings` - Criar reserva
  - [ ] Validar seats disponíveis
  - [ ] Calcular preço total
  - [ ] Criar booking com status "pending"
  - [ ] Notificar motorista

- [ ] **P0** - `PATCH /api/bookings/:id/status` - Atualizar status
  - [ ] Transições válidas (pending→confirmed, pending→rejected)
  - [ ] Atualizar seats da viagem
  - [ ] Notificar passageiro

- [ ] **P1** - `GET /api/bookings/passenger` - Minhas reservas (passageiro)
  - [ ] Listar por passenger_id
  - [ ] Incluir detalhes da viagem

- [ ] **P1** - `GET /api/bookings/driver` - Reservas dos meus passageiros
  - [ ] Listar bookings das viagens do motorista
  - [ ] Incluir status do passageiro

#### Database Engineer
- [ ] **P0** - Trigger `validate_booking_transition`
  - [ ] Impedir transições inválidas de status

- [ ] **P0** - Trigger `update Ride seats on booking`
  - [ ] Decrementar seats quando confirmado
  - [ ] Incrementar seats quando cancelado

### Dia 3: Backend - Perfis e Veículos

#### Backend Developer
- [ ] **P0** - `PUT /api/profiles/:id` - Atualizar perfil
  - [ ] Upload de avatar (multer)
  - [ ] Validar phone format
  - [ ] Atualizar nome, bio, etc.

- [ ] **P1** - `GET /api/profiles/:id/public` - Perfil público
  - [ ] Dados públicos apenas
  - [ ] Rating e reviews

- [ ] **P0** - `POST /api/vehicles` - Adicionar veículo
  - [ ] Validar dados (make, model, year, plate)
  - [ ] Upload de documentos (CNH, documento do carro)

- [ ] **P1** - `PATCH /api/vehicles/:id` - Atualizar veículo
- [ ] **P1** - `DELETE /api/vehicles/:id` - Remover veículo

#### Database Engineer
- [ ] **P0** - Criar tabela `vehicle_documents`
  - [ ] document_type (cnh, registration, insurance)
  - [ ] document_url
  - [ ] expiry_date
  - [ ] verification_status

- [ ] **P1** - Trigger `check_vehicle_limit`
  - [ ] Limite de 5 veículos por usuário

### Dia 4: Backend - Mensagens e Notificações

#### Backend Developer
- [ ] **P0** - `GET /api/messages?ride_id=:id` - Listar mensagens
  - [ ] Filtrar por viagem
  - [ ] Ordenar por created_at
  - [ ] Incluir status de leitura

- [ ] **P0** - `POST /api/messages` - Enviar mensagem
  - [ ] Validar destinatário
  - [ ] Salvar mensagem
  - [ ] Notificar destinatário (websocket/push)

- [ ] **P0** - `PATCH /api/messages/:id/read` - Marcar como lida
  - [ ] Atualizar is_read = true
  - [ ] Atualizar read_at

- [ ] **P1** - `GET /api/messages/unread/count` - Contar não lidas

#### Database Engineer
- [ ] **P0** - Índices de performance
  - [ ] idx_messages_ride_id
  - [ ] idx_messages_sender_id
  - [ ] idx_messages_receiver_id
  - [ ] idx_messages_is_read (partial)

- [ ] **P1** - Trigger `notify_on_message`
  - [ ] Inserir notification quando receber mensagem

### Dia 5: Backend - Admin e Relatórios

#### Backend Developer
- [ ] **P0** - `GET /api/admin/stats` - Estatísticas gerais
  - [ ] Total usuários, viagens, reservas
  - [ ] Faturamento do dia/mês
  - [ ] Crescimento

- [ ] **P1** - `GET /api/admin/users` - Listar usuários
  - [ ] Filtros (role, status, date range)
  - [ ] Pagination

- [ ] **P1** - `PATCH /api/admin/users/:id/verify` - Verificar usuário
  - [ ] Aprovar/rejeitar documentos
  - [ ] Atualizar verification_status

- [ ] **P2** - `GET /api/admin/rides` - Todas as viagens
- [ ] **P2** - `GET /api/admin/bookings` - Todas as reservas

#### Database Engineer
- [ ] **P0** - View `vw_admin_dashboard`
  - [ ] Stats consolidados
  - [ ] Últimas atividades

- [ ] **P1** - Procedure `sp_generate_report`
  - [ ] Relatório de faturamento
  - [ ] Exportar CSV/JSON

---

## 🔹 SEMANA 2: Frontend + Integração (Dia 6-10)

### Dia 6: Frontend - Auth e Perfil

#### Frontend Developer
- [ ] **P0** - Login/Registro funcional
  - [ ] Validação de formulário
  - [ ] Tratamento de erro
  - [ ] Redirecionamento correto

- [ ] **P0** - Recuperação de senha
  - [ ] Esqueci minha senha
  - [ ] Reset via email

- [ ] **P0** - Perfil do usuário
  - [ ] Upload de foto
  - [ ] Edição de dados
  - [ ] Upload de documentos

- [ ] **P1** - Configurações
  - [ ] Notificações
  - [ ] Privacidade
  - [ ] Idioma

### Dia 7: Frontend - Publicar Viagem (Driver)

#### Frontend Developer
- [ ] **P0** - Formulário de publicação
  - [ ] Origem/Destino (autocomplete)
  - [ ] Data/Hora (picker)
  - [ ] Preço e assentos
  - [ ] Preview da viagem

- [ ] **P0** - Validações
  - [ ] Campos obrigatórios
  - [ ] Data mínima (agora)
  - [ ] Preço mínimo

- [ ] **P1** - Recorrência
  - [ ] Viagem única
  - [ ] Recorrente (diária, semanal)

### Dia 8: Frontend - Busca e Resultados

#### Frontend Developer
- [ ] **P0** - Busca com filtros
  - [ ] Origem/Destino
  - [ ] Data
  - [ ] Passageiros
  - [ ] Ordenação (preço, horário)

- [ ] **P0** - Lista de resultados
  - [ ] Cards de viagem
  - [ ] Filtros laterais
  - [ ] Loading states

- [ ] **P1** - Mapa de rotas
  - [ ] Visualizar no mapa
  - [ ] Waypoints

### Dia 9: Frontend - Detalhes e Reserva

#### Frontend Developer
- [ ] **P0** - Detalhes da viagem
  - [ ] Informações completas
  - [ ] Motorista (rating, reviews)
  - [ ] Veículo
  - [ ] Política de cancelamento

- [ ] **P0** - Fluxo de reserva
  - [ ] Selecionar assentos
  - [ ] Revisar pedido
  - [ ] Confirmar
  - [ ] Feedback visual

- [ ] **P1** - Pagamento (simulado)
  - [ ] Selecionar método
  - [ ] Processar
  - [ ] Comprovante

### Dia 10: Frontend - Dashboards

#### Frontend Developer
- [ ] **P0** - Dashboard Motorista
  - [ ] Estatísticas (ganhos, viagens, rating)
  - [ ] Próximas viagens
  - [ ] Solicitações pendentes
  - [ ] Ações rápidas

- [ ] **P0** - Dashboard Passageiro
  - [ ] Próximas viagens
  - [ ] Histórico
  - [ ] Favoritos

- [ ] **P1** - Gráficos
  - [ ] Evolução de ganhos
  - [ ] Estatísticas mensais

---

## 🔹 SEMANA 3: Testes + Polimento (Dia 11-15)

### Dia 11-12: Testes Automatizados

#### Backend Developer
- [ ] **P0** - Testes unitários (Jest)
  - [ ] Auth endpoints
  - [ ] Rides endpoints
  - [ ] Bookings endpoints
  - [ ] Vehicles endpoints

- [ ] **P1** - Testes de integração
  - [ ] Fluxo completo de reserva
  - [ ] Fluxo de publicação

#### Frontend Developer
- [ ] **P0** - Testes de componentes (Vitest)
  - [ ] Botões, inputs
  - [ ] Cards, modals

- [ ] **P1** - Testes de páginas
  - [ ] Home, SearchResults
  - [ ] PublishRide, Dashboard

### Dia 13: Testes E2E (Playwright)

#### DevOps
- [ ] **P0** - Fluxo de autenticação
  - [ ] Registro
  - [ ] Login
  - [ ] Logout

- [ ] **P0** - Fluxo de passageiro
  - [ ] Buscar viagem
  - [ ] Reservar assento
  - [ ] Ver minhas reservas

- [ ] **P0** - Fluxo de motorista
  - [ ] Publicar viagem
  - [ ] Gerenciar reservas
  - [ ] Cancelar viagem

### Dia 14: Performance e Otimização

#### Backend Developer
- [ ] **P0** - Query optimization
  - [ ] Analisar slow queries
  - [ ] Adicionar índices faltantes
  - [ ] Implementar cache (Redis)

- [ ] **P1** - API rate limiting
  - [ ] Limitar requisições por IP
  - [ ] throttle em endpoints críticos

#### Frontend Developer
- [ ] **P0** - Code splitting
  - [ ] Lazy loading de rotas
  - [ ] Chunk optimization

- [ ] **P1** - Imagens otimizadas
  - [ ] WebP format
  - [ ] Lazy loading

### Dia 15: UX e Acessibilidade

#### Frontend Developer
- [ ] **P1** - Loading states
  - [ ] Skeleton screens
  - [ ] Loading spinners
  - [ ] Progress indicators

- [ ] **P1** - Tratamento de erro
  - [ ] Error boundaries
  - [ ] Mensagens amigáveis
  - [ ] Retry mechanism

- [ ] **P2** - Acessibilidade
  - [ ] ARIA labels
  - [ ] Navegação por teclado
  - [ ] Contrast ratio

---

## 🔹 SEMANA 4: Deploy + Monitoramento (Dia 16-20)

### Dia 16-17: CI/CD

#### DevOps
- [ ] **P0** - GitHub Actions workflow
  - [ ] Test on push
  - [ ] Build validation
  - [ ] Deploy on success

- [ ] **P0** - Docker production
  - [ ] Multi-stage build
  - [ ] Health checks
  - [ ] Resource limits

- [ ] **P1** - Deploy automatizado
  - [ ] Staging environment
  - [ ] Production deploy
  - [ ] Rollback automático

### Dia 18: Monitoramento

#### DevOps
- [ ] **P0** - Logs centralizados
  - [ ] Backend logs (Winston + ELK)
  - [ ] Frontend logs (Sentry)
  - [ ] Database logs

- [ ] **P0** - Métricas
  - [ ] Response time
  - [ ] Error rate
  - [ ] Request count

- [ ] **P1** - Alertas
  - [ ] Error rate > 1%
  - [ ] Response time > 2s
  - [ ] Downtime detection

### Dia 19: Segurança

#### Backend Developer
- [ ] **P0** - Revisão de segurança
  - [ ] SQL injection
  - [ ] XSS prevention
  - [ ] CSRF tokens
  - [ ] Input sanitization

- [ ] **P0** - JWT security
  - [ ] Token expiration
  - [ ] Refresh tokens
  - [ ] Blacklist

- [ ] **P1** - Rate limiting
  - [ ] Login attempts
  - [ ] API endpoints

### Dia 20: Documentação e Handover

#### Todos
- [ ] **P0** - Documentação de API
  - [ ] Swagger/OpenAPI
  - [ ] Exemplos de uso

- [ ] **P0** - README atualizado
  - [ ] Setup instructions
  - [ ] Environment variables
  - [ ] Troubleshooting

- [ ] **P1** - Playbook de operações
  - [ ] Como fazer deploy
  - [ ] Como investigar erros
  - [ ] Como escalar

---

## 📋 CHECKLIST GERAL DE FUNCIONALIDADES

### Autenticação e Usuário
- [ ] Registro com email/senha
- [ ] Login com JWT
- [ ] Recuperação de senha
- [ ] Upload de foto de perfil
- [ ] Edição de perfil
- [ ] Upload de documentos (CNH, etc.)
- [ ] Verificação de identidade
- [ ] Logout

### Viagens (Rides)
- [ ] Publicar nova viagem
- [ ] Editar viagem existente
- [ ] Cancelar viagem
- [ ] Listar minhas viagens
- [ ] Duplicar viagem recorrente
- [ ] Adicionar waypoints (paradas)
- [ ] Definir política de cancelamento
- [ ] Calcular preço dinâmico

### Reservas (Bookings)
- [ ] Buscar viagens (origem, destino, data)
- [ ] Filtros avançados (preço, horário, avaliação)
- [ ] Ordenação (mais barato, mais rápido, melhor avaliado)
- [ ] Reservar assento(s)
- [ ] Cancelar reserva
- [ ] Reembolso automático
- [ ] Histórico de reservas
- [ ] Avaliar motorista/passageiro

### Mensagens
- [ ] Enviar mensagem
- [ ] Receber mensagem em tempo real
- [ ] Marcar como lida
- [ ] Contagem de não lidas
- [ ] Histórico de conversas
- [ ] Anexar arquivo (comprovante)

### Notificações
- [ ] Notificação push
- [ ] Notificação no app
- [ ] Email de confirmação
- [ ] Lembrete de viagem
- [ ] Promoções e ofertas

### Dashboards
- [ ] Dashboard motorista (ganhos, estatísticas)
- [ ] Dashboard passageiro (viagens, favoritos)
- [ ] Dashboard admin (usuários, relatórios)
- [ ] Gráficos de performance
- [ ] Exportar relatórios

### Admin
- [ ] Gerenciar usuários
- [ ] Aprovar documentos
- [ ] Visualizar estatísticas
- [ ] Gerar relatórios
- [ ] Configurações do sistema

---

## 🎯 CRITÉRIOS DE PRONTO (Definition of Done)

### Backend
- [ ] Todos endpoints respondendo em < 200ms
- [ ] Taxa de erro < 0.1%
- [ ] Cobertura de testes > 80%
- [ ] Documentação Swagger atualizada
- [ ] Rate limiting implementado
- [ ] Logs em produção
- [ ] Health check endpoint

### Frontend
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Total Bundle Size < 500KB
- [ ] Testes passando
- [ ] Sem erros no console
- [ ] Responsivo (mobile-first)

### Database
- [ ] Todas queries < 50ms
- [ ] Índices criados
- [ ] Backups diários
- [ ] Point-in-time recovery
- [ ] RLS policies ativas

---

## 📊 MATRIZ DE DEPENDÊNCIAS

```
Backend Auth → Frontend Auth → Login funcional
     ↓
Backend Rides → Frontend PublishRide → Publicar viagem
     ↓
Backend Bookings → Frontend SearchResults → Reservar assento
     ↓
Backend Messages → Frontend Chat → Chat em tempo real
     ↓
Backend Admin → Frontend Admin → Dashboard admin
```

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Vazamento de dados | Baixa | Crítico | RLS, JWT seguro, env vars |
| Downtime do banco | Média | Alto | Backups, réplicas, monitoring |
| Performance ruim | Média | Médio | Índices, cache, CDN |
| Bugs em produção | Alta | Médio | Testes E2E, staging env |
| Ataque de força bruta | Baixa | Alto | Rate limiting, 2FA |

---

> **Próximo Passo:** Revisar cronograma com a equipe e iniciar Dia 1 da Semana 1.
