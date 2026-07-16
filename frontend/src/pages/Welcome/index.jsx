import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { Avatar } from "../../components/Avatar"
import { Skeleton } from "../../components/Skeleton"
import { api } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import styles from './welcome.module.css'

const PersonRow = ({ person }) => {
    const [following, setFollowing] = useState(Boolean(person.isFollowing))
    const [busy, setBusy] = useState(false)

    const toggle = async () => {
        if (busy) return
        const next = !following
        setFollowing(next)
        setBusy(true)
        try {
            const res = next ? await api.followUser(person.id) : await api.unfollowUser(person.id)
            setFollowing(res.isFollowing)
        } catch {
            setFollowing(!next)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className={styles.person}>
            <div className={styles.personInfo}>
                <Avatar author={person} size={44} />
                <div className={styles.identity}>
                    <strong>{person.name}</strong>
                    {person.username && <span>@{person.username}</span>}
                </div>
            </div>
            <Button outline={following} onClick={toggle} disabled={busy}>
                {following ? 'Seguindo' : 'Seguir'}
            </Button>
        </div>
    )
}

export const Welcome = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [people, setPeople] = useState(null)
    const [tags, setTags] = useState([])
    const [selectedTags, setSelectedTags] = useState([])

    useEffect(() => {
        api.discoverUsers().then((list) => setPeople(Array.isArray(list) ? list.slice(0, 6) : [])).catch(() => setPeople([]))
        api.getTags().then((list) => setTags(Array.isArray(list) ? list.slice(0, 12) : [])).catch(() => setTags([]))
    }, [])

    const toggleTag = (tag) =>
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

    const finish = () => navigate('/')

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <Typography variant="h1" color="--highlight-green" className={styles.title}>
                    Bem-vindo(a){user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🎉
                </Typography>
                <Typography variant="body" color="--light-gray">
                    Vamos personalizar sua experiência no Code Connect.
                </Typography>
            </header>

            <section className={styles.section}>
                <Typography variant="h2" color="--offwhite" className={styles.sectionTitle}>
                    Escolha seus interesses
                </Typography>
                {tags.length === 0 ? (
                    <Typography variant="body" color="--medium-gray">
                        Nenhuma tag disponível ainda.
                    </Typography>
                ) : (
                    <div className={styles.tags}>
                        {tags.map(({ tag }) => (
                            <button
                                key={tag}
                                type="button"
                                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className={styles.section}>
                <Typography variant="h2" color="--offwhite" className={styles.sectionTitle}>
                    Pessoas para seguir
                </Typography>
                {people === null ? (
                    <div className={styles.people}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} width="100%" height="64px" radius={12} />
                        ))}
                    </div>
                ) : people.length === 0 ? (
                    <Typography variant="body" color="--medium-gray">
                        Ainda não há outras pessoas para sugerir.
                    </Typography>
                ) : (
                    <div className={styles.people}>
                        {people.map((p) => (
                            <PersonRow key={p.id} person={p} />
                        ))}
                    </div>
                )}
            </section>

            <div className={styles.actions}>
                <button type="button" className={styles.skip} onClick={finish}>
                    Pular
                </button>
                <Button onClick={finish}>Começar a explorar</Button>
            </div>
        </main>
    )
}
