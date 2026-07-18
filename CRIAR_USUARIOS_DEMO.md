# 🔐 Criando Usuários de Demonstração no Supabase

## Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **app-angola** (ID: `mvfliifsrqdswrzwtkzn`)

## Passo 2: Criar os Usuários

### Via Authentication (Mais Fácil)

1. No menu lateral, vá em **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Crie os 3 usuários:

#### Usuário 1: Passageiro

- **Email**: `passageiro@demo.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅ (marque esta opção)
- Clique em **"Create user"**

#### Usuário 2: Motorista

- **Email**: `motorista@demo.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅
- Clique em **"Create user"**

#### Usuário 3: Admin

- **Email**: `admin@demo.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅
- Clique em **"Create user"**

## Passo 3: Aplicar o Schema de Produção

1. No menu lateral, vá em **SQL Editor**
2. Clique em **"New query"**
3. Cole o conteúdo do arquivo `supabase/schema_production.sql`
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

⚠️ **IMPORTANTE**: Aguarde a mensagem de sucesso antes de continuar.

## Passo 4: Configurar Permissões dos Usuários

1. Ainda no **SQL Editor**, clique em **"New query"**
2. Cole o conteúdo do arquivo `supabase/setup_demo_users.sql`
3. Clique em **"Run"**

Este script vai:

- ✅ Definir `admin@demo.com` como **admin**
- ✅ Definir `motorista@demo.com` como **driver** (motorista verificado)
- ✅ Definir `passageiro@demo.com` como **passenger**
- ✅ Criar um veículo de exemplo para o motorista

## Passo 5: Verificar

1. Volte para **Authentication** → **Users**
2. Você deve ver os 3 usuários criados
3. Vá em **Table Editor** → **profiles**
4. Você deve ver os 3 perfis com as roles corretas

## ✅ Pronto!

Agora você pode fazer login no site usando qualquer uma das contas:

- 👤 **Passageiro**: passageiro@demo.com / password123
- 🚘 **Motorista**: motorista@demo.com / password123
- 🛡️ **Admin**: admin@demo.com / password123

---

## 🔧 Troubleshooting

### "Email not confirmed"

- Certifique-se de marcar **"Auto Confirm User"** ao criar os usuários

### "Invalid login credentials"

- Verifique se digitou o email e senha corretamente
- Confirme que o usuário foi criado no Supabase

### "User already registered"

- O usuário já existe, você pode fazer login diretamente
- Ou delete o usuário existente e crie novamente
