# 🚀 Guia Rápido: Criar Usuários Motorista e Admin

## ⚠️ IMPORTANTE

Você precisa criar os usuários de autenticação PRIMEIRO no Supabase Dashboard, e DEPOIS executar o script SQL.

---

## Passo 1: Criar Usuários no Supabase Auth

Acesse: https://supabase.com/dashboard/project/mvfliifsrqdswrzwtkzn/auth/users

Clique em **"Add user"** → **"Create new user"** e crie os 2 usuários:

### 👨‍✈️ Motorista Demo

- **Email**: `motorista@demo.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO!**
- Clique em **"Create user"**

### 🛡️ Admin Demo

- **Email**: `admin@demo.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO!**
- Clique em **"Create user"**

---

## Passo 2: Executar Script SQL

Depois de criar os 2 usuários acima, execute o script abaixo no SQL Editor:

👉 https://supabase.com/dashboard/project/mvfliifsrqdswrzwtkzn/sql/new

```sql
-- ============================================
-- CONFIGURAR MOTORISTA E ADMIN
-- ============================================

DO $$
DECLARE
  motorista_id UUID;
  admin_id UUID;
BEGIN
  -- Buscar IDs dos usuários criados
  SELECT id INTO motorista_id FROM auth.users WHERE email = 'motorista@demo.com';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@demo.com';

  -- Verificar se os usuários existem
  IF motorista_id IS NULL THEN
    RAISE EXCEPTION 'ERRO: Usuário motorista@demo.com não encontrado! Crie-o primeiro no Auth Dashboard.';
  END IF;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'ERRO: Usuário admin@demo.com não encontrado! Crie-o primeiro no Auth Dashboard.';
  END IF;

  -- Configurar perfil do motorista
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

  RAISE NOTICE '✅ Perfil do motorista configurado com sucesso!';

  -- Criar veículo para o motorista
  INSERT INTO public.vehicles (owner_id, make, model, year, license_plate, color, seats, is_verified)
  VALUES (motorista_id, 'Toyota', 'Hiace', 2019, 'LD-22-44-AB', 'Azul e Branco', 14, true)
  ON CONFLICT (owner_id, license_plate) DO NOTHING;

  RAISE NOTICE '✅ Veículo do motorista criado com sucesso!';

  -- Configurar perfil do admin
  UPDATE public.profiles
  SET
    role = 'admin',
    full_name = 'Admin Sistema',
    phone = '+244 923 456 791',
    avatar_url = 'https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff',
    verification_status = 'verified'
  WHERE id = admin_id;

  RAISE NOTICE '✅ Perfil do admin configurado com sucesso!';

  -- Criar algumas caronas de exemplo para o motorista
  INSERT INTO public.rides (driver_id, origin, destination, date, time, price, available_seats, total_seats, status)
  VALUES
    (motorista_id, 'Luanda', 'Benguela', CURRENT_DATE + INTERVAL '2 days', '08:00', 8000, 12, 14, 'active'),
    (motorista_id, 'Luanda', 'Huambo', CURRENT_DATE + INTERVAL '5 days', '06:30', 12000, 10, 14, 'active'),
    (motorista_id, 'Benguela', 'Luanda', CURRENT_DATE + INTERVAL '7 days', '14:00', 7500, 14, 14, 'active')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Caronas de exemplo criadas para o motorista!';

END $$;

-- Verificar se tudo foi criado corretamente
SELECT
  p.email,
  p.full_name,
  p.role,
  p.verification_status,
  (SELECT COUNT(*) FROM vehicles WHERE owner_id = p.id) as vehicle_count,
  (SELECT COUNT(*) FROM rides WHERE driver_id = p.id) as rides_count
FROM public.profiles p
WHERE p.email IN ('motorista@demo.com', 'admin@demo.com')
ORDER BY p.role;
```

---

## ✅ Resultado Esperado

Você verá as mensagens:

```
✅ Perfil do motorista configurado com sucesso!
✅ Veículo do motorista criado com sucesso!
✅ Perfil do admin configurado com sucesso!
✅ Caronas de exemplo criadas para o motorista!
```

E uma tabela mostrando:

- **motorista@demo.com** - role: driver, 1 veículo, 3 caronas
- **admin@demo.com** - role: admin

---

## 🧪 Testar

Depois de executar o script, faça login com:

- 🚘 **Motorista**: `motorista@demo.com` / `password123`

  - Será redirecionado para `/dashboard/driver`
  - Verá suas caronas e estatísticas

- 🛡️ **Admin**: `admin@demo.com` / `password123`
  - Será redirecionado para `/admin`
  - Verá painel administrativo

---

## 📝 Notas

- ✅ O **Dashboard do Motorista** já está criado (`/dashboard/driver`)
- ✅ O **Dashboard do Admin** já está criado (`/admin`)
- ✅ O **Dashboard do Passageiro** já está criado (`/dashboard/passenger`)
- ✅ Todos os painéis estão funcionais e com estatísticas

**Você só precisa criar os 2 usuários no Auth Dashboard e executar o script SQL!** 🎉
