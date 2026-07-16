import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../Avatar'
import { IconBell } from '../icons/IconBell'
import { formatRelativeDate } from '../../utils/format'
import styles from './notificationbell.module.css'

const POLL_INTERVAL = 30000 // 30s

// Texto da notificação de acordo com o tipo
const describe = (type) => {
    switch (type) {
        case 'LIKE':
            return 'curtiu seu post'
        case 'COMMENT':
            return 'comentou no seu post'
        case 'FOLLOW':
            return 'começou a seguir você'
        case 'COMMENT_LIKE':
            return 'curtiu seu comentário'
        case 'MENTION':
            return 'mencionou você em um comentário'
        default:
            return 'interagiu com você'
    }
}

const targetOf = (n) => {
    if (n.type === 'FOLLOW') return `/user/${n.actor?.id}`
    if (n.post?.slug) return `/blog-post/${n.post.slug}`
    return null
}

export const NotificationBell = () => {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [unread, setUnread] = useState(0)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const ref = useRef(null)

    const loadCount = useCallback(async () => {
        try {
            const res = await api.getUnreadNotificationsCount()
            setUnread(res?.count ?? 0)
        } catch {
            // silencioso: contador é secundário
        }
    }, [])

    // Polling da contagem de não lidas enquanto autenticado
    useEffect(() => {
        if (!isAuthenticated) {
            setUnread(0)
            setItems([])
            return
        }
        loadCount()
        const id = setInterval(loadCount, POLL_INTERVAL)
        return () => clearInterval(id)
    }, [isAuthenticated, loadCount])

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const toggle = async () => {
        const next = !open
        setOpen(next)
        if (next) {
            setLoading(true)
            try {
                const list = await api.getNotifications()
                setItems(Array.isArray(list) ? list : [])
                // Marca como lidas ao abrir (zera o badge)
                if (unread > 0) {
                    await api.markNotificationsRead().catch(() => {})
                    setUnread(0)
                }
            } catch {
                setItems([])
            } finally {
                setLoading(false)
            }
        }
    }

    const openTarget = (n) => {
        const to = targetOf(n)
        setOpen(false)
        if (to) navigate(to)
    }

    if (!isAuthenticated) return null

    return (
        <div className={styles.wrapper} ref={ref}>
            <button
                type="button"
                className={styles.bell}
                onClick={toggle}
                aria-label="Notificações"
                aria-expanded={open}
            >
                <IconBell />
                {unread > 0 && (
                    <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {open && (
                <div className={styles.dropdown} role="menu">
                    <div className={styles.head}>
                        <span>Notificações</span>
                    </div>
                    {loading ? (
                        <div className={styles.empty}>Carregando...</div>
                    ) : items.length === 0 ? (
                        <div className={styles.empty}>Nenhuma notificação ainda.</div>
                    ) : (
                        <ul className={styles.list}>
                            {items.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        className={`${styles.item} ${n.read ? '' : styles.unreadItem}`}
                                        onClick={() => openTarget(n)}
                                    >
                                        <Avatar author={n.actor} />
                                        <span className={styles.text}>
                                            <strong>{n.actor?.name || 'Alguém'}</strong> {describe(n.type)}
                                            <span className={styles.time}>{formatRelativeDate(n.createdAt)}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
