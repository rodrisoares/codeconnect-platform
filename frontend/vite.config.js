import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Encaminha as rotas da API para o backend (:3000). Assim, do ponto de vista
// do navegador, front e API ficam na MESMA origem (:5173), o que permite usar
// cookies httpOnly com SameSite=Lax de forma confiável, inclusive em http.
const API_TARGET = 'http://localhost:3000'
const apiPaths = [
  '/auth',
  '/blog-posts',
  '/comments',
  '/users',
  '/uploads',
  '/bookmarks',
  '/notifications',
  '/about',
]

// Alguns prefixos (ex.: /auth, /about) existem tanto na API quanto como rota
// do SPA. Numa navegação do navegador (full page load / refresh), o header
// Accept inclui "text/html": nesse caso servimos o index.html (SPA) em vez de
// encaminhar para a API. Chamadas fetch/XHR (Accept != text/html) são
// encaminhadas normalmente para o backend.
const bypass = (req) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return '/index.html'
  }
}

const proxy = Object.fromEntries(
  apiPaths.map((p) => [p, { target: API_TARGET, changeOrigin: true, bypass }]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
})
