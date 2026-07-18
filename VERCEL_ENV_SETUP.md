# Configuração de Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE: Erro "Failed to fetch" no Supabase

Se você está vendo o erro **"TypeError: Failed to fetch"** ao tentar fazer login, é porque as variáveis de ambiente do Supabase **NÃO** estão configuradas no Vercel.

## 🔧 Como Resolver

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **boleia-angola-mvp**

### Passo 2: Adicionar as Variáveis de Ambiente

1. Vá em **Settings** (Configurações)
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis:

#### Variáveis Obrigatórias:

**Nome:** `VITE_SUPABASE_URL`
**Valor:** `https://mvfliifsrqdswrzwtkzn.supabase.co`
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `VITE_SUPABASE_ANON_KEY`
**Valor:** `sb_publishable_ae8r4Qvm0jhCUQAB9mf5Kw_6TZrqqBF`
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `GEMINI_API_KEY`
**Valor:** `AIzaSyBcdNDS6gYDzRP3yLDift6ca6-l1VnxVQ`
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

### Passo 3: Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos 3 pontinhos (...) do último deployment
3. Selecione **Redeploy**
4. Confirme

## ✅ Verificação

Após o redeploy, acesse o site e tente fazer login novamente. O erro "Failed to fetch" deve desaparecer.

## 📝 Notas

- As variáveis com prefixo `VITE_` são expostas no frontend (client-side).
- A `GEMINI_API_KEY` é usada para funcionalidades de IA (se implementadas).
- **NUNCA** compartilhe estas chaves publicamente em repositórios Git.

## 🔐 Segurança

Para produção real, considere:

1. Usar variáveis de ambiente diferentes para cada ambiente (dev, staging, prod)
2. Rotacionar as chaves periodicamente
3. Usar Row Level Security (RLS) no Supabase para proteger dados
