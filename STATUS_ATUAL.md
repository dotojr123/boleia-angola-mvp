# Status Atual do Projeto - Boleia Angola

**Data:** 2026-04-15
**Status:** Em desenvolvimento

---

## ✅ Funcionalidades Testadas e Validadas

### 1. Autenticação (Auth)
- [x] Registro de usuário (passageiro e motorista)
- [x] Login com JWT
- [x] Validação de credenciais
- [x] Token JWT com claims de role
- [x] Redirecionamento por perfil (passageiro, motorista, admin)

**Detalhes:**
- Endpoint `/api/auth/register` - Funcional
- Endpoint `/api/auth/login` - Funcional
- Usuários de teste criados:
  - `teste_driver@boleia.com` (DRIVER)
  - `passageiro_teste@boleia.com` (PASSENGER)
  - `admin@boleia.com` (ADMIN)

### 2. Viagens (Rides) - CRUD Motorista
- [x] Criar viagem (`POST /api/rides`)
- [x] Listar viagens do motorista (`GET /api/rides/my-rides`)
- [x] Listar todas viagens (`GET /api/rides`)
- [x] Detalhes da viagem (`GET /api/rides/:id`)
- [x] Atualizar viagem (`PATCH /api/rides/:id`) - **Validado com seats_available**
- [x] Cancelar viagem (`DELETE /api/rides/:id`)
- [x] Listar passageiros da viagem (`GET /api/rides/:id/passengers`)

**Correção Recente:**
- Campo `available_seats` alterado para `seats_available` em todo o código
- Validação de campos obrigatórios corrigida
- Servidor backend reiniciado para aplicar correções

**Dados de teste:**
- Viagem criada: `5ad5b0b6-18b8-4fbe-8f71-fd7adf15682c`
  - Origem: Luanda
  - Destino: Benguela
  - Assentos: 4
  - Preço: 5000 AOA

### 3. Reservas (Bookings) - CRUD Passageiro
- [x] Criar reserva (`POST /api/bookings`)
- [x] Listar reservas (`GET /api/bookings`)
- [x] Atualizar status (`PATCH /api/bookings/:id/status`) - Testado com admin
- [x] Listar reservas por passageiro (`GET /api/bookings`)
- [ ] Cancelar reserva - Pendente teste

**Dados de teste:**
- Reserva criada: `75068752-2e2d-43ac-8b92-7741509ff89f`
  - Viagem: `d577add4-35e5-45af-b136-240db5566ffd`
  - Assentos: 1
  - Status: **confirmed**
  - Total: 5000 AOA

### 4. Mensagens
- [x] Endpoint de parceiros criado (`GET /api/messages/partners`) - **Testado e funcional**
- [x] Listar mensagens entre usuários (`GET /api/messages/:receiverId`)
- [x] Enviar mensagem (`POST /api/messages`)
- [x] Mensagens salvas no banco de dados
- [x] Polling no frontend (3 segundos) para sincronização
- [x] Mapeamento correto dos dados no Chat.tsx

**Dados de teste:**
- 4 mensagens existentes no banco
- Sincronização via polling implementada
- Endpoint partners testado com sucesso

### 5. Painéis (Dashboards)
- [x] AdminDashboard - Estatísticas sincronizadas com `/api/admin/stats`
- [x] PassengerDashboard - Estatísticas sincronizadas com `/api/bookings`
- [x] DriverDashboard - Estatísticas sincronizadas com `/api/rides/my-rides` e `/api/bookings`
- [x] Loading states implementados
- [x] Tratamento de erro adicionado

### 6. Listagem de Viagens
- [x] Listar todas viagens disponíveis
- [x] Filtros por origem e destino
- [x] Inclusão de dados do motorista e veículo

---

## 📋 Próximos Testes a Realizar

### Pendentes
1. **Cancelar viagem com passageiros** - Validar bloqueio
2. **Perfil de usuário** - Atualizar e buscar dados
3. **Veículos** - CRUD completo
4. **Upload de imagens** - Testar multer
5. **Avaliações** - Implementar e testar

### Issues Conhecidas
1. Endpoint `/api/health` retorna 404 (não crítico)
2. Chat: Parceiros não aparecem para usuários sem mensagens prévias (comportamento esperado)

---

## 🔧 Configuração Atual

### Backend
- Porta: 3010
- Banco: PostgreSQL (boleia_angola)
- JWT Secret: supersecretkey
- Status: ✅ Rodando

### Frontend
- Porta: 3002 (Vite - portas 3000 e 3001 em uso)
- API URL: http://localhost:3010
- Status: ✅ Rodando

---

## 📝 Observações

1. **Correção de `seats_available`**: O campo foi padronizado em todo o backend
2. **Banco de dados**: Conectado e funcional com dados de teste
3. **Autenticação**: JWT funcionando corretamente
4. **Testes**: Fluxo básico de criação de viagem e reserva validado
5. **Mensagens**: Sincronização via polling (3s) implementada
6. **Persistência**: Dados salvos no banco corretamente
7. **Dashboards**: Todos painéis sincronizados com loading states e tratamento de erro
8. **Chat**: Mapeamento de dados corrigido para exibir parceiros e mensagens

---

## 🚀 Como Continuar

```bash
# Backend
cd /root/backup-boleia/boleia-angola/server
npm start

# Frontend
cd /root/backup-boleia/boleia-angola
npm run dev
```

**Tokens de teste:**
- Driver: `teste_driver@boleia.com` / `senha123`
- Passageiro: `passageiro_teste@boleia.com` / `senha123`
- Admin: `admin@boleia.com` / `admin123`
