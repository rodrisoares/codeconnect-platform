import { useState } from "react"
import { Link } from "react-router"
import { Author } from "../Author"
import { CommentsModal } from "../CommentsModal"
import { IconThumbsUp } from "../icons/IconThumbsUp"
import { IconChat } from "../icons/IconChat"
import { IconBookmark } from "../icons/IconBookmark"
import { api } from "../../services/api"
import { formatRelativeDate, formatFullDate, estimateReadingTime } from "../../utils/format"
import styles from './cardpost.module.css'

export const CardPost = ({ post, onToggleLike, onBookmarkChange }) => {
    const tags = Array.isArray(post.tags) ? post.tags : []
    const readingTime = estimateReadingTime(post.body, post.markdown)
    const [commentsCount, setCommentsCount] = useState(
        post.commentsCount ?? post.comments?.length ?? 0
    )
    const [showComments, setShowComments] = useState(false)
    const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarkedByMe))
    const [bookmarking, setBookmarking] = useState(false)

    const handleLike = (event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggleLike?.(post)
    }

    const handleBookmark = async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (bookmarking) return
        // Atualização otimista: alterna já e reverte se a API falhar
        const next = !bookmarked
        setBookmarked(next)
        setBookmarking(true)
        try {
            const res = await api.toggleBookmark(post.id)
            setBookmarked(res.bookmarked)
            onBookmarkChange?.(post, res.bookmarked)
        } catch {
            setBookmarked(!next)
        } finally {
            setBookmarking(false)
        }
    }

    const openComments = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setShowComments(true)
    }

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <figure className={styles.figure}>
                    <img
                        src={post.cover}
                        alt={`Capa do post de titulo: ${post.title}`}
                    />
                </figure>
            </header>
            <section className={styles.body}>
                <h2>
                    {/* Link "esticado": torna o card inteiro clicável */}
                    <Link to={`/blog-post/${post.slug}`} className={styles.stretched}>
                        {post.title}
                    </Link>
                </h2>
                <p>{post.body}</p>
                {tags.length > 0 && (
                    <div className={styles.tags}>
                        {tags.map((tag) => (
                            <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                )}
                <div className={styles.meta}>
                    <time dateTime={post.createdAt} title={formatFullDate(post.createdAt)}>
                        {formatRelativeDate(post.createdAt)}
                    </time>
                    <span>· {readingTime} min de leitura</span>
                </div>
            </section>
            <footer className={styles.footer}>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={`${styles.likeBtn} ${post.likedByMe ? styles.liked : ''}`}
                        onClick={handleLike}
                        aria-pressed={!!post.likedByMe}
                        aria-label={post.likedByMe ? 'Remover curtida' : 'Curtir'}
                    >
                        <IconThumbsUp /> {post.likes}
                    </button>
                    <button
                        type="button"
                        className={styles.likeBtn}
                        onClick={openComments}
                        aria-label="Ver comentários"
                    >
                        <IconChat /> {commentsCount}
                    </button>
                    <button
                        type="button"
                        className={`${styles.likeBtn} ${bookmarked ? styles.bookmarked : ''}`}
                        onClick={handleBookmark}
                        disabled={bookmarking}
                        aria-pressed={bookmarked}
                        aria-label={bookmarked ? 'Remover dos salvos' : 'Salvar post'}
                        title={bookmarked ? 'Remover dos salvos' : 'Salvar post'}
                    >
                        <IconBookmark filled={bookmarked} size={18} />
                    </button>
                </div>
                <Author author={post.author} />
            </footer>

            <CommentsModal
                post={post}
                open={showComments}
                onClose={() => setShowComments(false)}
                onCountChange={(_id, count) => setCommentsCount(count)}
            />
        </article>
    )
}
