import { useEffect, useState } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router"
import Typography from "../../components/Typography"
import { Avatar } from "../../components/Avatar"
import { Skeleton } from "../../components/Skeleton"
import { IconArrowBack } from "../../components/icons/IconArrowBack"
import { api } from "../../services/api"
import styles from './connections.module.css'

const TABS = [
    { key: 'followers', label: 'Seguidores' },
    { key: 'following', label: 'Seguindo' },
]

export const Connections = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') === 'following' ? 'following' : 'followers'

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        const fetcher = activeTab === 'following' ? api.getFollowing : api.getFollowers
        fetcher(id)
            .then((data) => { if (active) setUsers(data) })
            .catch(() => { if (active) setUsers([]) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [id, activeTab])

    return (
        <main className={styles.main}>
            <button type="button" className={styles.back} onClick={() => navigate(-1)}>
                <IconArrowBack color="currentColor" /> Voltar
            </button>

            <nav className={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {loading ? (
                <ul className={styles.list}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i} className={styles.item}>
                            <Skeleton width="40px" height="40px" radius={999} />
                            <Skeleton width="160px" height="16px" />
                        </li>
                    ))}
                </ul>
            ) : users.length === 0 ? (
                <div className={styles.empty}>
                    <Typography variant="body" color="--medium-gray">
                        {activeTab === 'following'
                            ? 'Ainda não segue ninguém.'
                            : 'Nenhum seguidor ainda.'}
                    </Typography>
                </div>
            ) : (
                <ul className={styles.list}>
                    {users.map((u) => (
                        <li key={u.id} className={styles.item}>
                            <Link to={`/user/${u.id}`} className={styles.link}>
                                <Avatar author={u} />
                                <div className={styles.identity}>
                                    <strong>{u.name}</strong>
                                    {u.username && <span>@{u.username}</span>}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}
