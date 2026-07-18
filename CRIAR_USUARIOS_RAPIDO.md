# 🚀 Como Criar Usuários Motorista e Admin Automaticamente

## Opção 1: Script Automático (Recomendado) ⚡

### Passo 1: Pegar a Service Role Key

1. Acesse: https://supabase.com/dashboard/project/mvfliifsrqdswrzwtkzn/settings/api
2. Procure por **"service_role"** (não é a "anon" key!)
3. Clique em "Reveal" e copie a chave
4. ⚠️ **CUIDADO**: Esta chave tem poderes de admin, nunca compartilhe!

### Passo 2: Configurar o Script

Abra o arquivo `create-demo-users.js` e substitua:

```javascript
const SUPABASE_SERVICE_ROLE_KEY = "SEU_SERVICE_ROLE_KEY_AQUI";
```

Por:

```javascript
const SUPABASE_SERVICE_ROLE_KEY = "sua-chave-aqui";
```

### Passo 3: Executar o Script

No terminal, execute:

```bash
node create-demo-users.js
```

**Pronto!** Os usuários serão criados automaticamente com:

- ✅ Motorista configurado com veículo e caronas
- ✅ Admin configurado
- ✅ Perfis completos

---

## Opção 2: Manual via Dashboard (Mais Simples) 👆

Se preferir não usar o script, siga estes passos:

### Passo 1: Criar Usuários

Acesse: https://supabase.com/dashboard/project/mvfliifsrqdswrzwtkzn/auth/users

Clique em **"Add user"** e crie:

1. **Motorista**:

   - Email: `motorista@demo.com`
   - Password: `password123`
   - ✅ Auto Confirm User

2. **Admin**:
   - Email: `admin@demo.com`
   - Password: `password123`
   - ✅ Auto Confirm User

### Passo 2: Executar SQL

Acesse: https://supabase.com/dashboard/project/mvfliifsrqdswrzwtkzn/sql/new

Cole e execute este SQL:

```sql
DO $$
DECLARE
  motorista_id UUID;
  admin_id UUID;
BEGIN
  -- Buscar IDs
  SELECT id INTO motorista_id FROM auth.users WHERE email = 'motorista@demo.com';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@demo.com';

  -- Configurar motorista
  UPDATE public.profiles
  SET
    role = 'driver',
    full_name = 'Carlos Motorista',
    phone = '+244 923 456 790',
    avatar_url = 'https://ui-avatars.com/api/?name=Carlos+Motorista&background=0D8ABC&color=fff',
    verification_status = 'verified',
    license_number = 'CNH-12345-AO',
    rating = 4.8,
    reviews_count = 15
  WHERE id = motorista_id;

  -- Criar veículo
  INSERT INTO public.vehicles (owner_id, make, model, year, license_plate, color, seats, is_verified)
  VALUES (motorista_id, 'Toyota', 'Hiace', 2019, 'LD-22-44-AB', 'Azul e Branco', 14, true);

  -- Criar caronas
  INSERT INTO public.rides (driver_id, origin, destination, date, time, price, available_seats, total_seats, status)
  VALUES
    (motorista_id, 'Luanda', 'Benguela', CURRENT_DATE + 2, '08:00', 8000, 12, 14, 'active'),
    (motorista_id, 'Luanda', 'Huambo', CURRENT_DATE + 5, '06:30', 12000, 10, 14, 'active');

  -- Configurar admin
  UPDATE public.profiles
  SET
    role = 'admin',
    full_name = 'Admin Sistema',
    phone = '+244 923 456 791',
    avatar_url = 'https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff',
    verification_status = 'verified'
  WHERE id = admin_id;

  RAISE NOTICE '✅ Tudo configurado!';
END $$;
```

---

## 🧪 Testar

Depois de criar os usuários, faça login:

- 🚘 **Motorista**: `motorista@demo.com` / `password123`
- 🛡️ **Admin**: `admin@demo.com` / `password123`

Cada um será redirecionado para seu dashboard específico!

---

## 📝 Qual Opção Escolher?

- **Script (Opção 1)**: Mais rápido, tudo automático
- **Manual (Opção 2)**: Mais simples, não precisa de service_role key

Escolha a que preferir! 🎉
