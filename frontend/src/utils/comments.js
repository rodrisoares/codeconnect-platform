// Helpers puros para manipular a árvore de comentários (1 nível de replies).
// Cada comentário raiz pode ter um array `replies`.

// Insere um comentário criado (raiz ou resposta) na lista.
export const insertComment = (list, comment) => {
    if (!comment.parentId) {
        return [{ ...comment, replies: comment.replies || [] }, ...list]
    }
    return list.map((c) =>
        c.id === comment.parentId
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
    )
}

// Atualiza um comentário (raiz ou resposta) pelo id, aplicando um patch.
export const updateInList = (list, id, patch) =>
    list.map((c) => {
        if (c.id === id) return { ...c, ...patch }
        if (c.replies?.length) {
            return {
                ...c,
                replies: c.replies.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            }
        }
        return c
    })

// Remove um comentário (raiz ou resposta) pelo id.
export const removeFromList = (list, id) =>
    list
        .filter((c) => c.id !== id)
        .map((c) =>
            c.replies?.length
                ? { ...c, replies: c.replies.filter((r) => r.id !== id) }
                : c
        )

// Conta o total incluindo respostas.
export const countComments = (list) =>
    list.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)
