
# Code Connect — Frontend

![Code Connect Cover](./src/assets/code-connect.png)

## 📖 Sobre

Interface web do **Code Connect**, uma rede social para desenvolvedores. É uma SPA (Single Page Application) em **React + Vite** que consome a [API do backend](../backend/README.md): feed de posts, publicação em Markdown, comentários, curtidas, bookmarks, perfis, seguidores e notificações.

A autenticação usa tokens JWT em cookies `httpOnly` — o navegador anexa os tokens automaticamente (`credentials: 'include'`) e a renovação da sessão é transparente. Em desenvolvimento, o Vite faz proxy das rotas da API para o backend, deixando front e API na mesma origem (`:5173`).

---

## ✨ Funcionalidades

- 🏠 **Feed** — posts publicados com paginação, busca, filtro por tag, "todos" ou "de quem sigo", e ordenação por recentes/populares.
- 📝 **Criação e edição de posts** — editor com corpo em Markdown, capa e tags (rota `post/new` e `post/edit/:slug`).
- 📄 **Página do post** — renderização de Markdown, curtidas e comentários.
- 💬 **Comentários e respostas** — comentar, responder (threads), curtir e menções (`@usuário`) com autocomplete.
- ❤️ **Curtidas e 🔖 Salvos** — curtir posts/comentários e salvar posts para ler depois.
- 👥 **Perfis e conexões** — perfil próprio e público, edição de perfil, seguir/deixar de seguir, listas de conexões e gráfico de contribuições.
- 🔎 **Descobrir pessoas** — busca e sugestões de usuários.
- 🔔 **Notificações** — sino com contador de não lidas (curtidas, comentários, seguidores).
- 🔐 **Autenticação** — registro e login com validação de senha, rotas protegidas e logout.
- 🌗 **Tema** — alternância de tema via contexto.
- 📱 **Responsivo** — layout adaptado para desktop e mobile.

---

## 🚀 Tecnologias Utilizadas

- **[React 19](https://react.dev/)**: Biblioteca para construção da interface.
- **[Vite 7](https://vite.dev/)**: Build tool e servidor de desenvolvimento (com proxy para a API).
- **[React Router 7](https://reactrouter.com/)**: Roteamento do SPA.
- **[react-markdown](https://github.com/remarkjs/react-markdown)**: Renderização de conteúdo em Markdown.
- **[ESLint](https://eslint.org/)**: Padronização e análise de código.

---

## ⚙️ Como Executar o Projeto

> ⚠️ O frontend depende da API do backend. Suba o backend antes (veja o [README do backend](../backend/README.md)); por padrão, ele roda em `http://localhost:3000`.

### Pré-requisitos

- [Node.js](https://nodejs.org/en) (versão 18 ou superior)
- [npm](https://www.npmjs.com/)

### Passos

1. **Acesse o diretório do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute a aplicação:**
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:5173`.

Após o seed do backend, entre com qualquer usuário de exemplo (senha `Code1234`), por exemplo `rodrigo@codeconnect.dev`.

### Configuração da API

Em desenvolvimento, o proxy do Vite (`vite.config.js`) encaminha as rotas da API (`/auth`, `/blog-posts`, `/comments`, `/users`, `/uploads`, `/bookmarks`, `/notifications`, `/about`) para `http://localhost:3000`. Não é necessária nenhuma variável de ambiente.

Para apontar para uma API em outra origem (ex.: produção), defina `VITE_API_URL`:

```bash
VITE_API_URL=https://api.seu-dominio.com
```

---

## 📜 Scripts

| Script            | O que faz                              |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (Vite)     |
| `npm run build`   | Build de produção                      |
| `npm run preview` | Serve o build de produção localmente   |
| `npm run lint`    | ESLint em todo o projeto               |

---

## 📁 Estrutura do Projeto

```
src/
├── assets/       # Imagens e recursos estáticos
├── components/   # Componentes reutilizáveis (UI, formulários, comentários, etc.)
├── context/      # Contextos globais (AuthContext, ThemeContext)
├── hooks/        # Hooks customizados (useAuth)
├── layouts/      # Layouts de página (App, Auth)
├── pages/        # Páginas/telas (Feed, BlogPost, Profile, People, ...)
├── router/       # Definição das rotas (React Router)
├── services/     # Cliente da API (api.js)
├── utils/        # Funções auxiliares (format, password, comments)
├── index.css     # Estilos globais
└── main.jsx      # Ponto de entrada da aplicação
```
