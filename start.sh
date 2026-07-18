#!/bin/bash
# Script de inicialização do Boleia Angola

echo "🚀 Iniciando Boleia Angola..."

# Iniciar backend
echo "📦 Iniciando backend (porta 3010)..."
cd /root/backup-boleia/boleia-angola/server
npm start &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd /root/backup-boleia/boleia-angola
npm run dev &
FRONTEND_PID=$!

echo "✅ Serviços iniciadas!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Aguardar processos
wait
