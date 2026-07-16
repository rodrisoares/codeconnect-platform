import styles from './blogpost.module.css'
import { IconButton } from "../../components/IconButton"
import { IconChat } from "../../components/icons/IconChat"
import { IconThumbsUp } from "../../components/icons/IconThumbsUp"
import { IconArrowBack } from "../../components/icons/IconArrowBack"
import { Author } from "../../components/Author"
import Typography from "../../components/Typography"
import { CommentList } from "../../components/CommentList"
import { CommentForm } from "../../components/CommentForm"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { Toast } from "../../components/Toast"
import { Spinner } from "../../components/Spinner"
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from "react-router"
import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { formatRelativeDate, formatFullDate } from "../../utils/format"
import { insertComment, updateInList, removeFromList, countComments } from "../../utils/comments"

export const BlogPost = () => {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [liking, setLiking] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    // Comentários carregados sob demanda (paginados)
    const [comments, setComments] = useState([])
    const [commentsMeta, setCommentsMeta] = useState(null)
    const [commentTotal, setCommentTotal] = useState(0)
    const [loadingMore, setLoadingMore] = useState(false)

    const showToast = (message, variant = 'error') => setToast({ message, variant })
    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    useEffect(() => {
        let active = true
        setLoading(true)
        api.getPostBySlug(slug)
            .then((data) => {
                if (!active) return
                setPost(data)
                setCommentTotal(data.commentsCount ?? 0)
            })
            .catch(() => { if (active) navigate('/not-found') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [slug, navigate])

    // Carrega a 1ª página de comentários quando o post estiver disponível
    useEffect(() => {
        if (!post?.id) return
        let active = true
        api.getComments(post.id, 1)
            .then((res) => {
                if (!active) return
                setComments(res.data)
                setCommentsMeta(res.meta)
            })
            .catch(() => { if (active) setComments([]) })
        return () => { active = false }
    }, [post?.id])

    const isAuthor = user && post && user.id === post.author?.id

    const bumpComments = (delta) => setCommentTotal((t) => Math.max(0, t + delta))

    const loadMoreComments = async () => {
        if (!commentsMeta?.hasMore || loadingMore) return
        setLoadingMore(true)
        try {
            const res = await api.getComments(post.id, commentsMeta.page + 1)
            setComments((prev) => [...prev, ...res.data])
            setCommentsMeta(res.meta)
        } catch {
            // mantém o que já foi carregado
        } finally {
            setLoadingMore(false)
        }
    }

    const handleLike = async () => {
        if (!post || liking) return
        // Like otimista: atualiza a UI na hora e reverte se a API falhar
        const previous = { likes: post.likes, likedByMe: post.likedByMe }
        setPost((prev) => ({
            ...prev,
            likes: prev.likedByMe ? prev.likes - 1 : prev.likes + 1,
            likedByMe: !prev.likedByMe,
        }))
        setLiking(true)
        try {
            const updated = await api.likePost(post.id)
            setPost((prev) => ({ ...prev, likes: updated.likes, likedByMe: updated.likedByMe }))
        } catch (error) {
            setPost((prev) => ({ ...prev, ...previous }))
            showToast(error.message || 'Não foi possível curtir o post')
        } finally {
            setLiking(false)
        }
    }

    const handleAddComment = async (text, parentId) => {
        setSubmittingComment(true)
        try {
            const created = await api.createComment(post.id, text, parentId)
            setComments((prev) => insertComment(prev, created))
            bumpComments(1)
            return true
        } catch (error) {
            showToast(error.message || 'Não foi possível comentar')
            return false
        } finally {
            setSubmittingComment(false)
        }
    }

    const handleReplyComment = (parentId, text) => handleAddComment(text, parentId)

    const handleUpdateComment = async (id, text) => {
        try {
            const updated = await api.updateComment(id, text)
            setComments((prev) => updateInList(prev, id, { text: updated.text }))
            return true
        } catch (error) {
            showToast(error.message || 'Não foi possível atualizar o comentário')
            return false
        }
    }

    const handleDeleteComment = async (id) => {
        try {
            await api.deleteComment(id)
            const next = removeFromList(comments, id)
            bumpComments(-(countComments(comments) - countComments(next)))
            setComments(next)
        } catch (error) {
            showToast(error.message || 'Não foi possível excluir o comentário')
        }
    }

    const handleDeletePost = async () => {
        setDeleting(true)
        try {
            await api.deletePost(post.id)
            navigate('/profile')
        } catch (error) {
            showToast(error.message || 'Não foi possível excluir o post')
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    if (loading) {
        return <Spinner />
    }

    if (!post) {
        return null
    }

    const tags = Array.isArray(post.tags) ? post.tags : []

    return (
        <main className={styles.main}>
            <div className={styles.topbar}>
                <button type="button" className={styles.back} onClick={() => navigate(-1)}>
                    <IconArrowBack color="currentColor" /> Voltar
                </button>
                {isAuthor && (
                    <div className={styles.ownerActions}>
                        <button
                            type="button"
                            className={styles.edit}
                            onClick={() => navigate(`/post/edit/${post.slug}`)}
                            aria-label="Editar post"
                            title="Editar post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={styles.delete}
                            onClick={() => setConfirmDelete(true)}
                            aria-label="Excluir post"
                            title="Excluir post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <article className={styles.card}>
                <div className={styles.hero}>
                    <img
                        src={post.cover}
                        alt={`Capa do post de titulo: ${post.title}`}
                    />
                    <div className={styles.heroOverlay}>
                        {tags.length > 0 && (
                            <div className={styles.tags}>
                                {tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                        <h1 className={styles.title}>{post.title}</h1>
                    </div>
                </div>

                <section className={styles.body}>
                    <div className={styles.byline}>
                        <Author author={post.author} />
                        <time dateTime={post.createdAt} title={formatFullDate(post.createdAt)}>
                            {formatRelativeDate(post.createdAt)}
                        </time>
                    </div>
                    <p>{post.body}</p>
                </section>

                <footer className={styles.footer}>
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={`${styles.action} ${post.likedByMe ? styles.liked : ''}`}
                            onClick={handleLike}
                            aria-pressed={!!post.likedByMe}
                            aria-label={post.likedByMe ? 'Remover curtida' : 'Curtir post'}
                        >
                            <IconThumbsUp />
                            <span>{post.likes}</span>
                        </button>
                        <div className={styles.action}>
                            <IconButton aria-label="Comentários">
                                <IconChat />
                            </IconButton>
                            <span>{commentTotal}</span>
                        </div>
                    </div>
                </footer>
            </article>

            <Typography variant="h3">Código:</Typography>
            <div className={styles.code}>
                <ReactMarkdown>
                    {post.markdown}
                </ReactMarkdown>
            </div>

            <div className={styles.commentsWrapper}>
                <CommentForm onSubmit={handleAddComment} submitting={submittingComment} />
                <CommentList
                    comments={comments}
                    total={commentTotal}
                    currentUserId={user?.id}
                    onUpdate={handleUpdateComment}
                    onDelete={handleDeleteComment}
                    onReply={handleReplyComment}
                />
                {commentsMeta?.hasMore && (
                    <div className={styles.loadMoreComments}>
                        <button
                            type="button"
                            onClick={loadMoreComments}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Carregando...' : 'Carregar mais comentários'}
                        </button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmDelete}
                title="Excluir post"
                message="Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                loading={deleting}
                onConfirm={handleDeletePost}
                onCancel={() => setConfirmDelete(false)}
            />

            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </main>
    )
}
