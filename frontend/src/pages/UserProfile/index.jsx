import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { CardPost } from "../../components/CardPost"
import { Skeleton } from "../../components/Skeleton"
import { Toast } from "../../components/Toast"
import { Badges } from "../../components/Badges"
import { ContributionGraph } from "../../components/ContributionGraph"
import { IconArrowBack } from "../../components/icons/IconArrowBack"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import styles from './userprofile.module.css'

export const UserProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [following, setFollowing] = useState(false)
    const [followBusy, setFollowBusy] = useState(false)
    const [followersCount, setFollowersCount] = useState(0)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    useEffect(() => {
        // Redireciona para o próprio perfil quando a rota apontar para o
        // usuário logado (seja por id ou por username, ex.: via @menção)
        if (user && (user.id === id || user.username === id)) {
            navigate('/profile', { replace: true })
            return
        }
        let active = true
        setLoading(true)
        const load = async () => {
            try {
                const [data, authorPosts] = await Promise.all([
                    api.getUserProfile(id),
                    api.getPostsByAuthor(id).catch(() => []),
                ])
                if (!active) return
                // Segurança extra: se a API confirmar que é o próprio usuário
                // (ex.: parâmetro que não bateu no check acima), redireciona
                if (data.isMe) {
                    navigate('/profile', { replace: true })
                    return
                }
                setProfile(data)
                setPosts(authorPosts)
                setFollowing(Boolean(data.isFollowing))
                setFollowersCount(data.followersCount ?? 0)
            } catch {
                if (active) setNotFound(true)
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        return () => { active = false }
    }, [id, user, navigate])

    const handleToggleLike = async (post) => {
        try {
            const res = await api.likePost(post.id)
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id ? { ...p, likes: res.likes, likedByMe: res.likedByMe } : p
                )
            )
        } catch {
            // ignora falha de curtida
        }
    }

    const toggleFollow = async () => {
        if (followBusy) return
        setFollowBusy(true)
        try {
            const result = following
                ? await api.unfollowUser(id)
                : await api.followUser(id)
            setFollowing(result.isFollowing)
            setFollowersCount(result.followersCount)
        } catch (error) {
            setToast({ message: error.message || 'Ação indisponível', variant: 'error' })
        } finally {
            setFollowBusy(false)
        }
    }

    if (loading) {
        return (
            <main className={styles.main}>
                <header className={styles.header}>
                    <Skeleton width="120px" height="120px" radius={999} />
                    <div className={styles.info}>
                        <Skeleton width="160px" height="16px" />
                        <Skeleton width="220px" height="28px" />
                        <Skeleton width="70%" height="14px" />
                    </div>
                </header>
            </main>
        )
    }

    if (notFound || !profile) {
        return (
            <main className={styles.main}>
                <Typography variant="h2" color="--offwhite">
                    Usuário não encontrado.
                </Typography>
            </main>
        )
    }

    const username = profile.username || 'usuario'
    const initial = (profile.name || username).charAt(0).toUpperCase()

    return (
        <main className={styles.main}>
            <button type="button" className={styles.back} onClick={() => navigate(-1)}>
                <IconArrowBack color="currentColor" /> Voltar
            </button>

            <header className={styles.header}>
                <div className={styles.avatar}>
                    {profile.avatar ? (
                        <img src={profile.avatar} alt={`Avatar de ${profile.name}`} />
                    ) : (
                        <span className={styles['avatar-fallback']}>{initial}</span>
                    )}
                </div>
                <div className={styles.info}>
                    <div className={styles['info-top']}>
                        <Typography variant="body" color="--medium-gray">
                            @{username}
                        </Typography>
                        {profile.isMe ? (
                            <Button outline onClick={() => navigate('/profile/edit')}>
                                Editar perfil
                            </Button>
                        ) : (
                            <Button outline={following} onClick={toggleFollow} disabled={followBusy}>
                                {following ? 'Seguindo' : 'Seguir'}
                            </Button>
                        )}
                    </div>
                    <Typography variant="h1" color="--highlight-green" className={styles.name}>
                        {profile.name}
                    </Typography>
                    {profile.bio && (
                        <Typography variant="body" color="--light-gray" className={styles.bio}>
                            {profile.bio}
                        </Typography>
                    )}
                    <div className={styles.stats}>
                        <span><strong>{profile.postsCount ?? posts.length}</strong> Projetos</span>
                        <Link to={`/user/${id}/connections?tab=followers`} className={styles.statLink}>
                            <strong>{followersCount}</strong> Seguidores
                        </Link>
                        <Link to={`/user/${id}/connections?tab=following`} className={styles.statLink}>
                            <strong>{profile.followingCount ?? 0}</strong> Seguindo
                        </Link>
                    </div>
                    <Badges badges={profile.badges} />
                </div>
            </header>

            <ContributionGraph userId={profile.id} />

            <div className={styles.sectionTitle}>
                <Typography variant="h2" color="--offwhite">Projetos</Typography>
            </div>

            {posts.length > 0 ? (
                <section className={styles.grid}>
                    {posts.map((post) => (
                        <CardPost key={post.slug} post={post} onToggleLike={handleToggleLike} />
                    ))}
                </section>
            ) : (
                <div className={styles.empty}>
                    <Typography variant="body" color="--medium-gray">
                        Este usuário ainda não publicou projetos.
                    </Typography>
                </div>
            )}

            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </main>
    )
}
