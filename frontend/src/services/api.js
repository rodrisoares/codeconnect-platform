// Autenticação via cookies httpOnly: o navegador anexa os tokens
// automaticamente (credentials: 'include'). Em dev, o Vite faz proxy para o
// backend, então tudo fica na mesma origem. Não há mais token em localStorage.
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Renova o access token. O refresh token viaja no cookie httpOnly.
const tryRefresh = async () => {
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: '{}',
        })
        return res.ok
    } catch {
        return false
    }
}

const request = async (path, options = {}) => {
    const { method = 'GET', body, auth = false, isForm = false, _retry = false } = options
    const headers = {}
    if (!isForm) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
    })

    // Access token expirado: tenta renovar uma vez (via cookie) e refaz
    if (response.status === 401 && auth && !_retry) {
        const ok = await tryRefresh()
        if (ok) {
            return request(path, { ...options, _retry: true })
        }
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const message = data?.message
        throw new Error(
            Array.isArray(message)
                ? message.join(', ')
                : message || 'Erro ao comunicar com o servidor'
        )
    }

    return data
}

export const api = {
    BASE_URL,
    login: (email, password) =>
        request('/auth/login', { method: 'POST', body: { email, password } }),
    register: (name, email, password) =>
        request('/auth/register', { method: 'POST', body: { name, email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me', { auth: true }),
    updateProfile: (payload) =>
        request('/auth/me', { method: 'PATCH', body: payload, auth: true }),
    getPosts: (params = {}) => {
        const q = new URLSearchParams()
        if (params.page) q.set('page', params.page)
        if (params.limit) q.set('limit', params.limit)
        if (params.tag) q.set('tag', params.tag)
        if (params.search) q.set('search', params.search)
        if (params.filter) q.set('filter', params.filter)
        if (params.sort) q.set('sort', params.sort)
        const qs = q.toString()
        return request(`/blog-posts${qs ? `?${qs}` : ''}`, { auth: true })
    },
    getTags: () => request('/blog-posts/tags', { auth: true }),
    getPostBySlug: (slug) => request(`/blog-posts/slug/${slug}`, { auth: true }),
    getPostsByAuthor: (authorId) => request(`/blog-posts/author/${authorId}`, { auth: true }),
    getLikedPosts: () => request('/blog-posts/liked', { auth: true }),
    likePost: (id) => request(`/blog-posts/${id}/like`, { method: 'POST', auth: true }),
    createPost: (payload) =>
        request('/blog-posts', { method: 'POST', body: payload, auth: true }),
    updatePost: (id, payload) =>
        request(`/blog-posts/${id}`, { method: 'PATCH', body: payload, auth: true }),
    deletePost: (id) =>
        request(`/blog-posts/${id}`, { method: 'DELETE', auth: true }),
    uploadImage: (file) => {
        const form = new FormData()
        form.append('file', file)
        return request('/uploads', { method: 'POST', body: form, auth: true, isForm: true })
    },
    getAbout: () => request('/about'),

    // Comentários
    getComments: (postId, page = 1, limit = 10) =>
        request(`/comments/post/${postId}?page=${page}&limit=${limit}`, { auth: true }),
    createComment: (postId, text, parentId) =>
        request(`/comments/post/${postId}`, {
            method: 'POST',
            body: parentId ? { text, parentId } : { text },
            auth: true,
        }),
    updateComment: (id, text) =>
        request(`/comments/${id}`, { method: 'PATCH', body: { text }, auth: true }),
    deleteComment: (id) =>
        request(`/comments/${id}`, { method: 'DELETE', auth: true }),
    likeComment: (id) =>
        request(`/comments/${id}/like`, { method: 'POST', auth: true }),

    // Perfil público e conexões (follow)
    getUserProfile: (id) => request(`/users/${id}`, { auth: true }),
    getUserActivity: (id) => request(`/users/${id}/activity`, { auth: true }),
    getFollowers: (id) => request(`/users/${id}/followers`, { auth: true }),
    getFollowing: (id) => request(`/users/${id}/following`, { auth: true }),
    followUser: (id) => request(`/users/${id}/follow`, { method: 'POST', auth: true }),
    unfollowUser: (id) => request(`/users/${id}/follow`, { method: 'DELETE', auth: true }),

    // Descoberta de pessoas
    discoverUsers: (search) => {
        const qs = search ? `?search=${encodeURIComponent(search)}` : ''
        return request(`/users${qs}`, { auth: true })
    },

    // Bookmarks (posts salvos)
    getBookmarks: () => request('/bookmarks', { auth: true }),
    toggleBookmark: (postId) =>
        request(`/bookmarks/${postId}`, { method: 'POST', auth: true }),

    // Notificações
    getNotifications: () => request('/notifications', { auth: true }),
    getUnreadNotificationsCount: () =>
        request('/notifications/unread-count', { auth: true }),
    markNotificationsRead: () =>
        request('/notifications/read', { method: 'PATCH', auth: true }),
}
