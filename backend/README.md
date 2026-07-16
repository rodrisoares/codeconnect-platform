# 🚀 Code Connect — Backend

API REST de uma rede social para desenvolvedores, construída com **NestJS**, **Prisma** e **SQLite**. Oferece autenticação com cookies httpOnly, publicação de posts, comentários com respostas, curtidas, bookmarks, seguidores, notificações e upload de imagens.

## 📋 Sobre o Projeto

O Code Connect é uma plataforma onde desenvolvedores compartilham conteúdo sobre programação e interagem entre si. Esta API fornece todos os endpoints necessários para:

- **Autenticação de usuários** — registro, login e sessão via tokens JWT em cookies `httpOnly` (access + refresh)
- **Posts** — criar, listar (com paginação, busca, filtros e ordenação), editar, excluir, curtir e organizar por tags
- **Comentários** — comentar posts, responder comentários (threads de 1 nível) e curtir comentários
- **Bookmarks** — salvar posts para ler depois
- **Perfis e conexões** — perfil público, busca de pessoas, seguir/deixar de seguir e gráfico de atividade
- **Notificações** — de curtidas, comentários e novos seguidores
- **Uploads** — envio de imagens (avatares e capas de posts)
- **Documentação Swagger** — interativa em `/api`

## 🛠️ Tecnologias Utilizadas

- **[NestJS 11](https://nestjs.com/)** — Framework Node.js para APIs escaláveis
- **[Prisma 6](https://prisma.io/)** — ORM moderno para TypeScript
- **[SQLite](https://sqlite.org/)** — Banco de dados local (arquivo `prisma/dev.db`)
- **[JWT](https://jwt.io/)** (`@nestjs/jwt`) — Autenticação via access/refresh tokens
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** — Hash de senhas
- **[Swagger](https://swagger.io/)** (`@nestjs/swagger`) — Documentação interativa da API
- **[Helmet](https://helmetjs.github.io/)** — Hardening de cabeçalhos HTTP
- **[@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)** — Rate limiting
- **[class-validator / class-transformer](https://github.com/typestack/class-validator)** — Validação de DTOs
- **[Multer](https://github.com/expressjs/multer)** — Upload de arquivos
- **[Jest](https://jestjs.io/)** — Testes unitários
- **[TypeScript](https://www.typescriptlang.org/)**

## ⚡ Como Rodar o Projeto

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm**

### 🔧 Configuração

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
Copie o arquivo de exemplo e ajuste os valores conforme necessário:
```bash
cp .env.example .env
```

O `.env` contém:
```env
DATABASE_URL="file:./dev.db"

# Segredos JWT (defina valores fortes em produção)
JWT_SECRET="secretKey"
JWT_REFRESH_SECRET="refreshSecretKey"

# Origens permitidas no CORS (lista separada por vírgula)
CORS_ORIGIN="http://localhost:5173"
```

> ⚠️ Em produção, defina segredos fortes e únicos para `JWT_SECRET` e `JWT_REFRESH_SECRET`.

3. **Execute as migrações e o seed:**
```bash
# Gera o banco SQLite e aplica as migrações
npx prisma migrate dev

# Popula o banco com usuários, posts e comentários de exemplo
npx prisma db seed
```

### 🚀 Executando a Aplicação

```bash
# Modo desenvolvimento (com hot-reload)
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

- **API:** `http://localhost:3000`
- **Documentação Swagger:** `http://localhost:3000/api`
- **Imagens enviadas (estáticas):** `http://localhost:3000/uploads/...`

A porta pode ser alterada pela variável de ambiente `PORT`.

## 🔒 Segurança e Autenticação

- Os tokens JWT são entregues em **cookies `httpOnly`** (`access` e `refresh`), não sendo expostos ao JavaScript do frontend.
- Um cookie-dica legível (`hint`, sem segredo) sinaliza ao frontend que existe uma sessão ativa, evitando chamadas desnecessárias a `/auth/me`.
- O CORS é habilitado com `credentials: true` para as origens definidas em `CORS_ORIGIN`.
- **Helmet** aplica hardening de cabeçalhos HTTP (com `crossOriginResourcePolicy` liberado para servir imagens ao frontend).
- **Rate limiting** (throttler) protege endpoints sensíveis — ex.: `POST /auth/login` (10/min), `POST /auth/register` (5/min), `POST /auth/refresh` (20/min), curtidas de posts (30/min). Limite global padrão: 120 req/min.
- **Validação global** com `whitelist`, `forbidNonWhitelisted` e `transform` — propriedades não declaradas nos DTOs são rejeitadas.

### Regras de senha
Ao registrar, a senha deve ter **no mínimo 8 caracteres**, com pelo menos **uma letra maiúscula, uma minúscula e um número**.

## 📊 Banco de Dados

O projeto usa **SQLite**, o que significa:

- ✅ **Sem dependências externas** (não precisa instalar PostgreSQL, Docker, etc.)
- ✅ **Portabilidade total** — o banco é um arquivo (`prisma/dev.db`)
- ✅ **Fácil backup** — basta copiar o arquivo
- ✅ **Perfeito para desenvolvimento** e pequenas aplicações

### Modelos principais

| Modelo | Descrição |
|--------|-----------|
| `User` | Usuários (perfil, avatar, bio, username) |
| `Post` | Posts (título, slug, capa, corpo/markdown, tags, status `DRAFT`/`PUBLISHED`) |
| `Comment` | Comentários e respostas (thread de 1 nível via `parentId`) |
| `Like` / `CommentLike` | Curtidas de posts e de comentários |
| `Bookmark` | Posts salvos por usuário |
| `Follow` | Relação de seguidores (seguidor ↔ seguido) |
| `Notification` | Notificações de `LIKE`, `COMMENT` e `FOLLOW` |

> Enums são representados como strings, pois o SQLite não suporta enums nativos.

### Visualizando os dados

```bash
# Interface gráfica do Prisma Studio
npx prisma studio
```

## 📁 Estrutura do Projeto

```
src/
├── auth/            # Autenticação (JWT, guards, cookies, refresh)
├── users/           # Perfis, busca, seguidores e atividade
├── posts/           # Posts, curtidas e tags (rota base: /blog-posts)
├── comments/        # Comentários, respostas e curtidas de comentários
├── bookmarks/       # Posts salvos
├── notifications/   # Notificações do usuário
├── uploads/         # Upload de imagens (Multer)
├── about/           # Conteúdo estático da página "Sobre nós"
├── prisma/          # PrismaService / PrismaModule
├── app.module.ts    # Módulo raiz
└── main.ts          # Bootstrap (CORS, Helmet, Swagger, estáticos)

prisma/
├── schema.prisma    # Schema do banco de dados
├── dev.db           # Banco SQLite (criado automaticamente)
├── migrations/      # Histórico de migrações
└── seed.ts          # Script de dados iniciais
```

## 🔐 Principais Endpoints

> A maioria dos endpoints exige autenticação (cookie de sessão ou `Authorization: Bearer <token>`). A documentação completa e interativa está disponível em `/api` (Swagger).

### Autenticação (`/auth`)
- `POST /auth/register` — Registrar novo usuário
- `POST /auth/login` — Fazer login
- `POST /auth/refresh` — Gerar novo access token a partir do refresh token
- `POST /auth/logout` — Encerrar a sessão (limpa os cookies)
- `GET /auth/me` — Dados do usuário logado 🔒
- `PATCH /auth/me` — Atualizar o próprio perfil 🔒

### Posts (`/blog-posts`) 🔒
- `GET /blog-posts` — Listar posts publicados (paginação, `search`, `tag`, `filter=all|following`, `sort=recent|popular`)
- `GET /blog-posts/tags` — Tags existentes com contagem de uso
- `GET /blog-posts/liked` — Posts curtidos pelo usuário logado
- `GET /blog-posts/author/:authorId` — Posts de um autor
- `GET /blog-posts/:id` — Buscar post por ID
- `GET /blog-posts/slug/:slug` — Buscar post por slug
- `POST /blog-posts` — Criar post
- `PATCH /blog-posts/:id` — Atualizar post (apenas o autor)
- `DELETE /blog-posts/:id` — Excluir post (apenas o autor)
- `POST /blog-posts/:id/like` — Curtir/descurtir (toggle)

### Comentários (`/comments`) 🔒
- `GET /comments/post/:postId` — Comentários de um post (paginado)
- `POST /comments/post/:postId` — Criar comentário (ou resposta, via `parentId`)
- `GET /comments/:id` — Buscar comentário por ID
- `PATCH /comments/:id` — Atualizar comentário (apenas o autor)
- `DELETE /comments/:id` — Excluir comentário (apenas o autor)
- `POST /comments/:id/like` — Curtir/descurtir comentário (toggle)

### Bookmarks (`/bookmarks`) 🔒
- `GET /bookmarks` — Listar posts salvos
- `POST /bookmarks/:postId` — Salvar/remover post (toggle)

### Usuários e conexões (`/users`) 🔒
- `GET /users?search=` — Descobrir/buscar pessoas
- `GET /users/:id` — Perfil público (com contadores de conexões)
- `GET /users/:id/activity` — Atividade diária dos últimos 12 meses
- `GET /users/:id/followers` — Seguidores
- `GET /users/:id/following` — Quem o usuário segue
- `POST /users/:id/follow` — Seguir
- `DELETE /users/:id/follow` — Deixar de seguir

### Notificações (`/notifications`) 🔒
- `GET /notifications` — Listar notificações
- `GET /notifications/unread-count` — Quantidade de não lidas
- `PATCH /notifications/read` — Marcar todas como lidas
- `PATCH /notifications/:id/read` — Marcar uma como lida

### Uploads (`/uploads`) 🔒
- `POST /uploads` — Enviar imagem (`multipart/form-data`, campo `file`; PNG/JPG/WEBP/GIF até 5MB). Retorna a URL pública.

### Sobre (`/about`)
- `GET /about` — Conteúdo estático da página "Sobre nós" (público)

## 🧪 Dados de Exemplo

Após executar o seed, você terá:

- **7 usuários** de exemplo (senha padrão: `Code1234`)
  - `rodrigo@codeconnect.dev`
  - `marina@codeconnect.dev`
  - `rafael@codeconnect.dev`
  - `juliana@codeconnect.dev`
  - `pedro@codeconnect.dev`
  - `camila@codeconnect.dev`
  - `lucas@codeconnect.dev`
- **16 posts** sobre diversos temas de programação
- **Comentários, curtidas e conexões** de exemplo

> Login de teste: qualquer e-mail acima com a senha `Code1234`.

## 🛠️ Comandos Úteis

```bash
# Rodar em modo desenvolvimento
npm run start:dev

# Build para produção
npm run build

# Linting (com --fix)
npm run lint

# Formatação (Prettier)
npm run format

# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Prisma — gerar client
npx prisma generate

# Prisma — aplicar migrações
npx prisma migrate dev

# Prisma — resetar banco (cuidado! apaga tudo)
npx prisma migrate reset

# Prisma — visualizar dados
npx prisma studio

# Rodar o seed novamente
npx prisma db seed
```

## ✅ Testes

Os testes são escritos com **Jest** e **ts-jest**. As suítes unitárias cobrem os serviços de domínio (`auth`, `posts` e `comments`), localizadas ao lado do código em arquivos `*.spec.ts`.

```bash
# Rodar os testes unitários
npm run test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Relatório de cobertura (gerado em ./coverage)
npm run test:cov
```

## 🔄 Desenvolvimento

Para desenvolver novas funcionalidades:

1. **Modifique o schema** (`prisma/schema.prisma`)
2. **Crie uma migração:** `npx prisma migrate dev --name nome-da-migracao`
3. **Implemente** o módulo (controller, service, DTOs) seguindo a estrutura existente
4. **Documente** os endpoints com os decorators do Swagger (`@ApiOperation`, `@ApiResponse`, etc.)
5. **Teste** pela documentação interativa em `/api` ou com Postman/Insomnia

## 💾 Backup

Para fazer backup dos dados:
```bash
# Copiar o banco
cp prisma/dev.db backup/dev-backup-$(date +%Y%m%d).db

# Ou exportar para SQL
sqlite3 prisma/dev.db .dump > backup/database-backup.sql
```

## 📝 Observações

- O banco SQLite é criado automaticamente na primeira execução das migrações.
- Os dados persistem entre reinicializações da aplicação.
- Para limpar todos os dados: `npx prisma migrate reset`.
- As imagens enviadas ficam na pasta `uploads/` e são servidas estaticamente em `/uploads`.
- Para produção, considere migrar para PostgreSQL ou MySQL e usar segredos JWT fortes.

---

✨ **Pronto para desenvolver!** A API sobe localmente sem nenhuma dependência externa e conta com documentação interativa em `/api`.
