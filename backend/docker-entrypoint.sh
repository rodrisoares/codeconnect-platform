#!/bin/sh
set -e

# Aplica as migrations no banco SQLite (cria o dev.db no volume, se necessário).
echo "==> Aplicando migrations (prisma migrate deploy)..."
npx prisma migrate deploy

# Popula o banco com dados de exemplo apenas na PRIMEIRA subida.
# O seed faz deleteMany() em tudo antes de inserir, então usamos um marcador
# no volume de dados para não apagar/recriar conteúdo em toda reinicialização.
if [ "${SEED}" = "true" ] && [ ! -f /app/data/.seeded ]; then
  echo "==> Populando banco com dados de exemplo (primeira execução)..."
  npx prisma db seed
  touch /app/data/.seeded
  echo "==> Seed concluído."
else
  echo "==> Seed ignorado (SEED != true ou banco já populado)."
fi

# O build gera dist/src/main.js (a estrutura é preservada porque o prisma/seed.ts
# fica fora de src/). Resolve o caminho de forma robusta caso isso mude.
if [ -f dist/src/main.js ]; then
  MAIN=dist/src/main.js
else
  MAIN=dist/main.js
fi

echo "==> Iniciando a API ($MAIN)..."
exec node "$MAIN"
