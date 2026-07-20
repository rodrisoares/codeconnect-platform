# ---------- Stage 1: build ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: runtime (nginx) ----------
FROM nginx:1.27-alpine AS runtime

# SPA buildada.
COPY --from=builder /app/dist /usr/share/nginx/html

# As capas do seed são gravadas no banco como "/src/assets/covers/<slug>.png"
# (caminho do Vite dev). Em produção esse caminho não existe no bundle, então
# copiamos as imagens originais para o mesmo caminho literal servido pelo nginx.
COPY --from=builder /app/src/assets/covers /usr/share/nginx/html/src/assets/covers

# Config do nginx: serve o SPA e faz proxy da API para o backend (mesma origem).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
