# Discovery: Boleia Angola - Sistema de Caronas Compartilhadas

**Data:** 2026-04-15  
**Status:** Concluído - Em validação  
**Responsável:** IA Agency Squad (Discovery Agent)

---

## 1. Visão e Problema

**Problema Central:** Falta de sistema de caronas seguro e confiável em Angola para conectar motoristas e passageiros em viagens interurbanas.

**Solução:** Plataforma digital que permite:
- Motoristas publicarem viagens com assentos disponíveis
- Passageiros buscarem e reservarem assentos em viagens
- Sistema seguro de autenticação e verificação
- Chat integrado entre motoristas e passageiros

**Usuários-Alvo:**
- Passageiros: Pessoas que precisam viajar entre cidades angolanas
- Motoristas: Condutores que oferecem serviço de transporte
- Admin: Gestores da plataforma

---

## 2. Funcionalidades Core

### Passageiro
- [x] Cadastro e login
- [x] Buscar viagens por origem/destino
- [x] Visualizar detalhes da viagem
- [x] Reservar assento
- [x] Ver histórico de reservas
- [x] Chat com motorista

### Motorista
- [x] Cadastro e login
- [x] Gerenciar veículos
- [x] Publicar viagens
- [x] Listar viagens publicadas
- [x] Ver reservas confirmadas
- [x] Chat com passageiro
- [x] Dashboard de ganhos

### Admin
- [x] Dashboard administrativo
- [x] Gerenciar usuários
- [x] Gerenciar viagens
- [x] Verificações

---

## 3. Monetização

**Modelo:** Comissão por viagem (configurável)
- Taxa sobre cada reserva confirmada
- Possibilidade de assinaturas premium para motoristas

---

## 4. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Node.js + Express |
| Banco | PostgreSQL 15 |
| Auth | JWT + RLS (Supabase) |
| Testes | Vitest + Playwright |

---

## 5. Contexto e Referências

**Projeto:** Boleia Angola  
**Localização:** /root/backup-boleia/boleia-angola/  
**Status:** Desenvolvimento concluído - Validação para produção

**Funcionalidades Implementadas:**
- Autenticação JWT com roles (passageiro, motorista, admin)
- CRUD completo de viagens
- CRUD completo de reservas
- Sistema de mensagens
- Dashboards por perfil
- Upload de imagens (parcial)

---

## 6. Escopo Negativo (o que NÃO será feito nesta versão)

- [x] Pagamento integrado (Stripe, etc.)
- [x] Avaliações e reviews (implementado mas não testado)
- [x] Notificações push em tempo real
- [x] Rastreamento GPS em tempo real
- [x] Múltiplos idiomas (apenas PT-BR)
- [x] Recuperação de senha (não implementado)

---

## 7. Dados de Teste

**Usuários:**
- Driver: `teste_driver@boleia.com` / `senha123`
- Passageiro: `passageiro_teste@boleia.com` / `senha123`
- Admin: `admin@boleia.com` / `admin123`

**Endpoints:**
- Frontend: http://localhost:3002
- Backend: http://localhost:3010
