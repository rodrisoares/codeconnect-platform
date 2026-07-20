# ---------- Stage 1: build ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# openssl é exigido pelo Prisma; python3/make/g++ compilam o bcrypt (módulo nativo).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Instala dependências primeiro (melhor cache de camadas).
COPY package*.json ./
RUN npm ci

# Copia o restante e gera o client do Prisma + build do Nest.
COPY . .
RUN npx prisma generate && npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# openssl é necessário em runtime para os engines do Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copia node_modules completo (inclui ts-node/typescript p/ rodar o seed) e o build.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Remove CRLF (caso o arquivo seja salvo no Windows), torna executável e cria as
# pastas que serão montadas como volumes.
RUN sed -i 's/\r$//' docker-entrypoint.sh \
  && chmod +x docker-entrypoint.sh \
  && mkdir -p /app/data /app/uploads

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
