import { useCallback, useEffect, useState } from "react"
import { CardPost } from "../../components/CardPost"
import { CardPostSkeleton } from "../../components/CardPost/CardPostSkeleton"
import { Button } from "../../components/Button"
import Typography from "../../components/Typography"
import { api } from "../../services/api"
import styles from './saved.module.css'

export const Saved = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(false)
        api.getBookmarks()
            .then((data) => { if (active) setPosts(Array.isArray(data) ? data : []) })
            .catch(() => { if (active) setError(true) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [])

    // Like otimista dentro da lista de salvos
    const handleToggleLike = useCallback(async (post) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === post.id
                    ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
                    : p
            )
        )
        try {
            const res = await api.likePost(post.id)
            setPosts((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, likes: res.likes, likedByMe: res.likedByMe } : p))
            )
        } catch {
            setPosts((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, likes: post.likes, likedByMe: post.likedByMe } : p))
            )
        }
    }, [])

    // Quando o post é removido dos salvos, tira do grid
    const handleBookmarkChange = useCallback((post, bookmarked) => {
        if (!bookmarked) {
            setPosts((prev) => prev.filter((p) => p.id !== post.id))
        }
    }, [])

    return (
        <div className={styles.wrapper}>
            <header className={styles.head}>
                <Typography variant="h1" color="--offwhite" className={styles.title}>
                    Posts salvos
                </Typography>
                <Typography variant="body" color="--medium-gray">
                    Projetos que você guardou para ler depois.
                </Typography>
            </header>

            {loading ? (
                <main className={styles.grid}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <CardPostSkeleton key={i} />
                    ))}
                </main>
            ) : error ? (
                <div className={styles.message}>
                    <Typography variant="h2" color="--offwhite">
                        Não foi possível carregar seus salvos.
                    </Typography>
                </div>
            ) : posts.length === 0 ? (
                <div className={styles.empty}>
                    <Typography variant="h2" color="--offwhite">
                        Você ainda não salvou nenhum post.
                    </Typography>
                    <Typography variant="body" color="--medium-gray">
                        Toque no ícone de marcador nos cards para salvá-los aqui.
                    </Typography>
                    <Button href="/">Explorar o feed</Button>
                </div>
            ) : (
                <main className={styles.grid}>
                    {posts.map((post) => (
                        <CardPost
                            key={post.slug}
                            post={post}
                            onToggleLike={handleToggleLike}
                            onBookmarkChange={handleBookmarkChange}
                        />
                    ))}
                </main>
            )}
        </div>
    )
}
