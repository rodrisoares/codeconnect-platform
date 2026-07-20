# Rodando o Code Connect com Docker

Sobe **frontend + backend** com um único comando. O frontend é buildado e
servido pelo **nginx**, que também faz proxy da API para o backend — assim tudo
fica na **mesma origem** (`http://localhost:8080`), o que é necessário para a
autenticação por cookies `httpOnly` funcionar.

## Arquitetura

```
Navegador ──▶ nginx (frontend, :8080)
                 ├── /            → SPA React (arquivos estáticos)
                 └── /auth, /blog-posts, /users, /uploads, /api ...
                                  → proxy para backend (:3000)

backend (NestJS) ── SQLite em volume (backend-data)
                 └─ uploads em volume (backend-uploads)
```

## Pré-requisitos

- Docker Desktop instalado e em execução.

## Passo a passo

1. (Opcional, mas recomendado) crie o arquivo de segredos:

   ```bash
   cp .env.example .env
   # edite .env e defina JWT_SECRET / JWT_REFRESH_SECRET
   ```

2. Suba os containers (build + run):

   ```bash
   docker compose up --build
   ```

3. Acesse:

   - App: <http://localhost:8080>
   - Swagger (API): <http://localhost:8080/api>

Na primeira subida o backend aplica as migrations e roda o **seed** (dados de
exemplo). Login de exemplo: `rodrigo@codeconnect.dev` (senha definida no
`prisma/seed.ts`).

## Comandos úteis

```bash
# Subir em segundo plano
docker compose up --build -d

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Parar e APAGAR o banco/uploads (recomeça do zero, re-executa o seed)
docker compose down -v

# Reconstruir só o backend
docker compose build backend && docker compose up -d backend
```

## Notas

- **Persistência:** o banco (`dev.db`) e os uploads ficam em volumes nomeados
  (`backend-data`, `backend-uploads`). Sobrevivem a `down`/`up`. Para zerar,
  use `docker compose down -v`.
- **Seed:** roda apenas uma vez, controlado por um marcador (`/app/data/.seeded`)
  no volume. Para forçar de novo, apague o volume (`down -v`) ou defina
  `SEED=false` para nunca rodar.
- **Capas dos posts:** o seed referencia as capas em `/src/assets/covers/...`
  (caminho do Vite dev). O `Dockerfile` do frontend copia essas imagens para o
  mesmo caminho no nginx, então elas aparecem normalmente em produção.
- **Porta:** para mudar de 8080, ajuste `ports` do serviço `frontend` no
  `docker-compose.yml` (ex.: `"3001:80"`) e atualize `CORS_ORIGIN` do backend
  para a nova origem.
