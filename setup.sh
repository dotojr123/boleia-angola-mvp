#!/bin/bash

# Boleia Angola - Setup Script
# Este script configura o ambiente de desenvolvimento

set -e

echo "🚗 Boleia Angola - Setup Script"
echo "==============================="

# 1. Check Node.js
echo -e "\n[1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 2. Check Docker
echo -e "\n[2/5] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker não encontrado. Instale Docker se for usar Docker Compose"
else
    echo "✅ Docker $(docker --version | head -1)"
fi

# 3. Install frontend dependencies
echo -e "\n[3/5] Instalando dependências do Frontend..."
npm install
echo "✅ Frontend dependencies installed"

# 4. Install backend dependencies
echo -e "\n[4/5] Instalando dependências do Backend..."
cd server
npm install
cd ..
echo "✅ Backend dependencies installed"

# 5. Setup environment files
echo -e "\n[5/5] Configurando variáveis de ambiente..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env criado"
else
    echo "ℹ️  .env já existe"
fi

if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "✅ server/.env criado"
else
    echo "ℹ️  server/.env já existe"
fi

echo ""
echo "==============================="
echo "Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Edite .env e server/.env com suas credenciais"
echo "2. Para usar Docker: docker-compose up -d"
echo "3. Para modo manual:"
echo "   - Backend:  cd server && npm run dev"
echo "   - Frontend: npm run dev"
echo ""
