import { useState } from "react"
import { Avatar } from "../Avatar"
import { ConfirmDialog } from "../ConfirmDialog"
import { MentionInput } from "../MentionInput"
import { MentionText } from "../MentionText"
import { IconThumbsUp } from "../icons/IconThumbsUp"
import { api } from "../../services/api"
import { formatRelativeDate } from "../../utils/format"
import styles from './comment.module.css'

export const Comment = ({ comment, currentUserId, onUpdate, onDelete, onReply, isReply = false }) => {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(comment.text)
    const [busy, setBusy] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [replying, setReplying] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [replyBusy, setReplyBusy] = useState(false)
    const [liked, setLiked] = useState(Boolean(comment.likedByMe))
    const [likes, setLikes] = useState(comment.likesCount || 0)
    const [likeBusy, setLikeBusy] = useState(false)

    const isOwner = currentUserId && comment.author?.id === currentUserId
    // Só é possível responder comentários raiz (thread de 1 nível) e estando logado
    const canReply = !isReply && currentUserId && typeof onReply === 'function'
    // Prefere o @username; cai para o nome caso o usuário não tenha username
    const handle = comment.author?.username || comment.author?.name

    const handleConfirmDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(comment.id)
        } finally {
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    const handleSave = async () => {
        const value = text.trim()
        if (!value || value === comment.text) {
            setEditing(false)
            setText(comment.text)
            return
        }
        setBusy(true)
        const ok = await onUpdate(comment.id, value)
        setBusy(false)
        if (ok) setEditing(false)
    }

    const handleSendReply = async () => {
        const value = replyText.trim()
        if (!value) return
        setReplyBusy(true)
        const ok = await onReply(comment.id, value)
        setReplyBusy(false)
        if (ok) {
            setReplyText('')
            setReplying(false)
        }
    }

    // Like otimista no comentário
    const handleLike = async () => {
        if (likeBusy || !currentUserId) return
        const next = !liked
        setLiked(next)
        setLikes((n) => (next ? n + 1 : Math.max(0, n - 1)))
        setLikeBusy(true)
        try {
            const res = await api.likeComment(comment.id)
            setLiked(res.likedByMe)
            setLikes(res.likes)
        } catch {
            setLiked(!next)
            setLikes((n) => (next ? Math.max(0, n - 1) : n + 1))
        } finally {
            setLikeBusy(false)
        }
    }

    return (
        <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
            <div className={styles.head}>
                <Avatar author={comment.author} />
                <strong>@{handle}</strong>
                <span className={styles.date}>{formatRelativeDate(comment.createdAt)}</span>
                {isOwner && !editing && (
                    <div className={styles.tools}>
                        <button type="button" onClick={() => setEditing(true)} aria-label="Editar comentário" title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </button>
                        <button type="button" className={styles.danger} onClick={() => setConfirmDelete(true)} aria-label="Excluir comentário" title="Excluir">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className={styles.editArea}>
                    <textarea
                        className={styles.editInput}
                        rows={2}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className={styles.editActions}>
                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={() => { setEditing(false); setText(comment.text) }}
                            disabled={busy}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className={styles.save}
                            onClick={handleSave}
                            disabled={busy}
                        >
                            {busy ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className={styles.text}><MentionText text={comment.text} /></p>
            )}

            {!editing && (
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
                        onClick={handleLike}
                        disabled={likeBusy || !currentUserId}
                        aria-pressed={liked}
                        aria-label={liked ? 'Remover curtida' : 'Curtir comentário'}
                    >
                        <IconThumbsUp /> {likes > 0 ? likes : ''}
                    </button>
                    {canReply && (
                        <button
                            type="button"
                            className={styles.replyBtn}
                            onClick={() => setReplying((v) => !v)}
                        >
                            {replying ? 'Cancelar' : 'Responder'}
                        </button>
                    )}
                </div>
            )}

            {replying && (
                <div className={styles.editArea}>
                    <MentionInput
                        className={styles.editInput}
                        rows={2}
                        placeholder={`Respondendo @${handle}... (use @ para mencionar)`}
                        value={replyText}
                        onChange={setReplyText}
                    />
                    <div className={styles.editActions}>
                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={() => { setReplying(false); setReplyText('') }}
                            disabled={replyBusy}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className={styles.save}
                            onClick={handleSendReply}
                            disabled={replyBusy || !replyText.trim()}
                        >
                            {replyBusy ? 'Enviando...' : 'Responder'}
                        </button>
                    </div>
                </div>
            )}

            {comment.replies?.length > 0 && (
                <div className={styles.replies}>
                    {comment.replies.map((reply) => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            isReply
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={confirmDelete}
                title="Excluir comentário"
                message="Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                loading={deleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    )
}
