import { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { Skeleton } from "../../components/Skeleton"
import { CardPost } from "../../components/CardPost"
import { Badges } from "../../components/Badges"
import { ContributionGraph } from "../../components/ContributionGraph"
import { IconChat } from "../../components/icons/IconChat"
import { IconThumbsUp } from "../../components/icons/IconThumbsUp"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { Toast } from "../../components/Toast"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { formatRelativeDate } from "../../utils/format"
import styles from './profile.module.css'

const ProjectCard = ({ post, onEdit, onDelete }) => (
    <article className={styles.card}>
        <Link to={`/blog-post/${post.slug}`} className={styles.cardLink} aria-label={`Abrir ${post.title}`}>
            <div
                className={styles.thumb}
                style={post.cover ? { backgroundImage: `url(${post.cover})` } : undefined}
                role="img"
                aria-label={`Capa de ${post.title}`}
            />
            <div className={styles['card-body']}>
                <Typography variant="h3" color="--offwhite" className={styles['card-title']}>
                    {post.title}
                </Typography>
                <Typography variant="body" color="--medium-gray" className={styles['card-text']}>
                    {post.body}
                </Typography>
                <span className={styles.date}>{formatRelativeDate(post.createdAt)}</span>
            </div>
        </Link>
        <footer className={styles['card-footer']}>
            <div className={styles.metrics}>
                <span className={styles.metric}>
                    <IconThumbsUp /> {post.likes}
                </span>
                <span className={styles.metric}>
                    <IconChat /> {post.commentsCount ?? post.comments?.length ?? 0}
                </span>
            </div>
            <div className={styles.cardActions}>
                <button type="button" onClick={() => onEdit(post)} aria-label="Editar projeto" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </button>
                <button type="button" className={styles.danger} onClick={() => onDelete(post)} aria-label="Excluir projeto" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>
        </footer>
    </article>
)

const StatCard = ({ label, value, to }) => {
    const content = (
        <>
            <strong>{value}</strong>
            <span>{label}</span>
        </>
    )
    if (to) {
        return <Link to={to} className={styles.statCard}>{content}</Link>
    }
    return <div className={styles.statCard}>{content}</div>
}

const ProfileSkeleton = () => (
    <main className={styles.main}>
        <header className={styles.header}>
            <Skeleton width="120px" height="120px" radius={999} />
            <div className={styles.info}>
                <Skeleton width="140px" height="16px" />
                <Skeleton width="220px" height="28px" />
                <Skeleton width="80%" height="14px" />
                <Skeleton width="60%" height="14px" />
            </div>
        </header>
        <section className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="100%" height="220px" radius={8} />
            ))}
        </section>
    </main>
)

export const Profile = () => {
    const navigate = useNavigate()
    const { user, isLoading: authLoading } = useAuth()
    const [stats, setStats] = useState(null)
    const [posts, setPosts] = useState([])
    const [liked, setLiked] = useState([])
    const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'liked' | 'drafts'
    const [loading, setLoading] = useState(true)
    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            setLoading(false)
            return
        }
        let active = true
        const load = async () => {
            try {
                const [profile, authorPosts, likedPosts] = await Promise.all([
                    api.getUserProfile(user.id).catch(() => null),
                    api.getPostsByAuthor(user.id),
                    api.getLikedPosts().catch(() => []),
                ])
                if (!active) return
                setStats(profile)
                setPosts(authorPosts)
                setLiked(likedPosts)
            } catch {
                if (active) setPosts([])
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        return () => { active = false }
    }, [user, authLoading])

    const published = useMemo(() => posts.filter((p) => p.status !== 'DRAFT'), [posts])
    const drafts = useMemo(() => posts.filter((p) => p.status === 'DRAFT'), [posts])

    const handleDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await api.deletePost(toDelete.id)
            setPosts((prev) => prev.filter((p) => p.id !== toDelete.id))
            setToDelete(null)
        } catch (error) {
            setToast({ message: error.message || 'Erro ao excluir', variant: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    // Like otimista na aba "Curtidos"
    const handleLikedToggle = async (post) => {
        setLiked((prev) =>
            prev.map((p) =>
                p.id === post.id
                    ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
                    : p
            )
        )
        try {
            const res = await api.likePost(post.id)
            setLiked((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, likes: res.likes, likedByMe: res.likedByMe } : p))
            )
        } catch {
            setLiked((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, likes: post.likes, likedByMe: post.likedByMe } : p))
            )
        }
    }

    if (authLoading || loading) {
        return <ProfileSkeleton />
    }

    if (!user) {
        return (
            <main className={styles.main}>
                <Typography variant="h2" color="--offwhite">
                    Não foi possível carregar o perfil.
                </Typography>
            </main>
        )
    }

    const username = user.username || user.email?.split('@')[0] || 'usuario'
    const initial = (user.name || username).charAt(0).toUpperCase()

    const tabs = [
        { key: 'posts', label: `Posts (${published.length})` },
        { key: 'liked', label: `Curtidos (${liked.length})` },
        { key: 'drafts', label: `Rascunhos (${drafts.length})` },
    ]

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.avatar}>
                    {user.avatar ? (
                        <img src={user.avatar} alt={`Avatar de ${user.name}`} />
                    ) : (
                        <span className={styles['avatar-fallback']}>{initial}</span>
                    )}
                </div>
                <div className={styles.info}>
                    <div className={styles['info-top']}>
                        <Typography variant="body" color="--medium-gray">
                            @{username}
                        </Typography>
                        <Button outline onClick={() => navigate('/profile/edit')}>
                            Editar perfil
                        </Button>
                    </div>
                    <Typography variant="h1" color="--highlight-green" className={styles.name}>
                        {user.name}
                    </Typography>
                    <Typography variant="body" color="--light-gray" className={styles.bio}>
                        {user.bio ||
                            'Desenvolvedor(a) da comunidade Code Connect, compartilhando projetos e ideias para transformar código em conexão.'}
                    </Typography>
                    <Badges badges={stats?.badges} />
                </div>
            </header>

            <section className={styles.statCards}>
                <StatCard label="Projetos" value={stats?.postsCount ?? published.length} />
                <StatCard label="Seguidores" value={stats?.followersCount ?? 0} to={`/user/${user.id}/connections?tab=followers`} />
                <StatCard label="Seguindo" value={stats?.followingCount ?? 0} to={`/user/${user.id}/connections?tab=following`} />
                <StatCard label="Likes recebidos" value={stats?.likesReceived ?? 0} />
            </section>

            <ContributionGraph userId={user.id} />

            <div className={styles.tabs}>
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'posts' && (
                published.length > 0 ? (
                    <section className={styles.grid}>
                        {published.map((post) => (
                            <ProjectCard
                                key={post.id}
                                post={post}
                                onEdit={(p) => navigate(`/post/edit/${p.slug}`)}
                                onDelete={(p) => setToDelete(p)}
                            />
                        ))}
                    </section>
                ) : (
                    <div className={styles.empty}>
                        <Typography variant="body" color="--medium-gray">
                            Você ainda não publicou nenhum projeto.
                        </Typography>
                        <Button href="/post/new">Publicar primeiro projeto</Button>
                    </div>
                )
            )}

            {activeTab === 'liked' && (
                liked.length > 0 ? (
                    <section className={styles.feedGrid}>
                        {liked.map((post) => (
                            <CardPost key={post.slug} post={post} onToggleLike={handleLikedToggle} />
                        ))}
                    </section>
                ) : (
                    <div className={styles.empty}>
                        <Typography variant="body" color="--medium-gray">
                            Você ainda não curtiu nenhum projeto.
                        </Typography>
                    </div>
                )
            )}

            {activeTab === 'drafts' && (
                drafts.length > 0 ? (
                    <section className={styles.grid}>
                        {drafts.map((post) => (
                            <ProjectCard
                                key={post.id}
                                post={post}
                                onEdit={(p) => navigate(`/post/edit/${p.slug}`)}
                                onDelete={(p) => setToDelete(p)}
                            />
                        ))}
                    </section>
                ) : (
                    <div className={styles.empty}>
                        <Typography variant="body" color="--medium-gray">
                            Nenhum rascunho salvo. Comece um projeto e salve como rascunho.
                        </Typography>
                        <Button href="/post/new">Criar rascunho</Button>
                    </div>
                )
            )}

            <ConfirmDialog
                open={!!toDelete}
                title="Excluir projeto"
                message={toDelete ? `Excluir "${toDelete.title}"? Esta ação não pode ser desfeita.` : ''}
                confirmLabel="Excluir"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setToDelete(null)}
            />

            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </main>
    )
}
