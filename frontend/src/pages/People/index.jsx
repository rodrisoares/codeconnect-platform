import { useEffect, useState } from "react"
import { Link } from "react-router"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { Avatar } from "../../components/Avatar"
import { Skeleton } from "../../components/Skeleton"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import styles from './people.module.css'

const UserCard = ({ person }) => {
    const [following, setFollowing] = useState(Boolean(person.isFollowing))
    const [count, setCount] = useState(person.followersCount ?? 0)
    const [busy, setBusy] = useState(false)

    const toggle = async () => {
        if (busy) return
        const next = !following
        // Otimista
        setFollowing(next)
        setCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
        setBusy(true)
        try {
            const res = next
                ? await api.followUser(person.id)
                : await api.unfollowUser(person.id)
            setFollowing(res.isFollowing)
            if (typeof res.followersCount === 'number') setCount(res.followersCount)
        } catch {
            setFollowing(!next)
            setCount((c) => (next ? Math.max(0, c - 1) : c + 1))
        } finally {
            setBusy(false)
        }
    }

    const username = person.username || 'usuario'

    return (
        <article className={styles.card}>
            <Link to={`/user/${person.id}`} className={styles.cardLink}>
                <Avatar author={person} size={56} />
                <div className={styles.meta}>
                    <Typography variant="h3" color="--offwhite" className={styles.name}>
                        {person.name}
                    </Typography>
                    <span className={styles.username}>@{username}</span>
                    {person.bio && <p className={styles.bio}>{person.bio}</p>}
                    <span className={styles.followers}>{count} seguidores</span>
                </div>
            </Link>
            <div className={styles.action}>
                <Button outline={following} onClick={toggle} disabled={busy}>
                    {following ? 'Seguindo' : 'Seguir'}
                </Button>
            </div>
        </article>
    )
}

export const People = () => {
    const { user } = useAuth()
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [people, setPeople] = useState([])
    const [loading, setLoading] = useState(true)

    // Debounce da busca
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        let active = true
        setLoading(true)
        api.discoverUsers(search)
            .then((data) => {
                if (!active) return
                // Garante que o próprio usuário não apareça
                setPeople((Array.isArray(data) ? data : []).filter((p) => p.id !== user?.id))
            })
            .catch(() => { if (active) setPeople([]) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [search, user?.id])

    return (
        <div className={styles.wrapper}>
            <header className={styles.head}>
                <Typography variant="h1" color="--offwhite" className={styles.title}>
                    Descobrir pessoas
                </Typography>
                <Typography variant="body" color="--medium-gray">
                    Encontre e siga outros desenvolvedores da comunidade.
                </Typography>
            </header>

            <div className={styles.searchBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="search"
                    placeholder="Buscar por nome ou @username..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Buscar pessoas"
                />
            </div>

            {!search && !loading && people.length > 0 && (
                <Typography variant="body" color="--medium-gray" className={styles.hint}>
                    Sugestões para você
                </Typography>
            )}

            {loading ? (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} width="100%" height="120px" radius={12} />
                    ))}
                </div>
            ) : people.length === 0 ? (
                <div className={styles.empty}>
                    <Typography variant="body" color="--medium-gray">
                        {search
                            ? 'Nenhuma pessoa encontrada para essa busca.'
                            : 'Nenhuma sugestão no momento.'}
                    </Typography>
                </div>
            ) : (
                <div className={styles.grid}>
                    {people.map((person) => (
                        <UserCard key={person.id} person={person} />
                    ))}
                </div>
            )}
        </div>
    )
}
