import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CommentForm } from "../CommentForm"
import { CommentList } from "../CommentList"
import { Spinner } from "../Spinner"
import { Toast } from "../Toast"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { insertComment, updateInList, removeFromList, countComments } from "../../utils/comments"
import styles from './commentsmodal.module.css'

export const CommentsModal = ({ post, open, onClose, onCountChange }) => {
    const { user } = useAuth()
    const [comments, setComments] = useState([])
    const [meta, setMeta] = useState(null)
    const [total, setTotal] = useState(post.commentsCount ?? 0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    useEffect(() => {
        if (!open) return
        let active = true
        setLoading(true)
        api.getComments(post.id, 1)
            .then((res) => {
                if (!active) return
                setComments(res.data)
                setMeta(res.meta)
            })
            .catch(() => { if (active) setComments([]) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [open, post.id])

    // Fecha com ESC
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    // Ajusta o total (todos os comentários) e avisa o contador do card.
    // Calcula fora do updater para não chamar setState do card durante o render.
    const bump = (delta) => {
        const next = Math.max(0, total + delta)
        setTotal(next)
        onCountChange?.(post.id, next)
    }

    const loadMore = async () => {
        if (!meta?.hasMore || loadingMore) return
        setLoadingMore(true)
        try {
            const res = await api.getComments(post.id, meta.page + 1)
            setComments((prev) => [...prev, ...res.data])
            setMeta(res.meta)
        } catch {
            // mantém o que já foi carregado
        } finally {
            setLoadingMore(false)
        }
    }

    const handleAdd = async (text, parentId) => {
        setSubmitting(true)
        try {
            const created = await api.createComment(post.id, text, parentId)
            setComments(insertComment(comments, created))
            bump(1)
            return true
        } catch (error) {
            setToast({ message: error.message || 'Não foi possível comentar', variant: 'error' })
            return false
        } finally {
            setSubmitting(false)
        }
    }

    const handleReply = (parentId, text) => handleAdd(text, parentId)

    const handleUpdate = async (id, text) => {
        try {
            const updated = await api.updateComment(id, text)
            setComments((prev) => updateInList(prev, id, { text: updated.text }))
            return true
        } catch (error) {
            setToast({ message: error.message || 'Não foi possível atualizar', variant: 'error' })
            return false
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.deleteComment(id)
            const next = removeFromList(comments, id)
            const removed = countComments(comments) - countComments(next)
            setComments(next)
            bump(-removed)
        } catch (error) {
            setToast({ message: error.message || 'Não foi possível excluir', variant: 'error' })
        }
    }

    return createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <header className={styles.head}>
                    <h3 className={styles.title}>{post.title}</h3>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </header>

                <div className={styles.body}>
                    <CommentForm onSubmit={handleAdd} submitting={submitting} />
                    {loading ? (
                        <Spinner />
                    ) : (
                        <>
                            <CommentList
                                comments={comments}
                                total={total}
                                currentUserId={user?.id}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                                onReply={handleReply}
                            />
                            {meta?.hasMore && (
                                <button
                                    type="button"
                                    className={styles.loadMore}
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Carregando...' : 'Carregar mais comentários'}
                                </button>
                            )}
                        </>
                    )}
                </div>

                <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
            </div>
        </div>,
        document.body
    )
}
