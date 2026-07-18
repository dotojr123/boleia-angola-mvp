# PRD - Boleia Angola

**Data:** 2026-04-15  
**Versão:** 1.0.0  
**Status:** Validação IA Agency Squad

---

## 1. Resumo Executivo

**Boleia Angola** é um sistema de caronas compartilhadas que conecta motoristas e passageiros em viagens interurbanas em Angola. A plataforma permite que motoristas publiquem viagens com assentos disponíveis e passageiros reservem assentos de forma segura e conveniente.

---

## 2. Personas

### 2.1 Passageiro
- **Perfil:** Pessoa que precisa viajar entre cidades angolanas
- **Necessidades:** Segurança, preço justo, facilidade de uso
- **Objetivos:** Encontrar e reservar assentos rapidamente

### 2.2 Motorista
- **Perfil:** Condutor que oferece serviço de transporte
- **Necessidades:** Visibilidade, gestão simples, recebimento garantido
- **Objetivos:** Maximizar ocupação e lucros

### 2.3 Admin
- **Perfil:** Gestor da plataforma
- **Necessidades:** Visão completa, controle de usuários e viagens
- **Objetivos:** Manter qualidade e segurança do serviço

---

## 3. User Stories com Critérios de Aceite

### US-001: Autenticação
- **Como** usuário não cadastrado
- **Quero** me cadastrar com e-mail e senha
- **Para** acessar o sistema

**Critérios:**
- [x] Campo e-mail com validação
- [x] Campo senha (mínimo 6 caracteres)
- [x] Seleção de perfil (passageiro/motorista)
- [x] Redirecionamento após cadastro

### US-002: Login
- **Como** usuário cadastrado
- **Quero** fazer login
- **Para** acessar minhas funcionalidades

**Critérios:**
- [x] Validação de credenciais
- [x] Token JWT
- [x] Redirecionamento por perfil

### US-003: Publicar Viagem (Motorista)
- **Como** motorista
- **Quero** publicar uma viagem
- **Para** oferecer assentos

**Critérios:**
- [x] Informar origem e destino
- [x] Data e hora
- [x] Número de assentos
- [x] Preço por assento
- [x] Bagagem permitida

### US-004: Buscar Viagem (Passageiro)
- **Como** passageiro
- **Quero** buscar viagens
- **Para** encontrar uma opção

**Critérios:**
- [x] Filtro por origem
- [x] Filtro por destino
- [x] Filtro por data
- [x] Listar resultados

### US-005: Reservar Assento
- **Como** passageiro
- **Quero** reservar assento
- **Para** garantir minha vaga

**Critérios:**
- [x] Selecionar assentos
- [x] Confirmar reserva
- [x] Atualizar disponíveis

### US-006: Chat
- **Como** usuário
- **Quero** conversar com outro usuário
- **Para** combinar detalhes

**Critérios:**
- [x] Enviar mensagem
- [x] Receber mensagens
- [x] Histórico

---

## 4. Requisitos Não Funcionais

| ID | Requisito | Meta |
|----|-----------|------|
| RNF-001 | Performance | Carregar em < 3s |
| RNF-002 | Disponibilidade | 99% uptime |
| RNF-003 | Segurança | JWT + RLS |
| RNF-004 | Escalabilidade | Suportar 1000 usuários |

---

## 5. Escopo Negativo

- [x] Pagamento integrado
- [x] Avaliações (implementado, não testado)
- [x] Notificações push
- [x] GPS em tempo real
- [x] Múltiplos idiomas
- [x] Recuperação de senha

---

## 6. Métricas de Sucesso

| KPI | Meta |
|-----|------|
| Usuários ativos | 1000/mês |
| Viagens publicadas | 500/mês |
| Reservas confirmadas | 80% |
| Tempo de resposta API | < 200ms |
