import { useCallback, useEffect, useState } from "react"
import { CardPost } from "../../components/CardPost"
import { CardPostSkeleton } from "../../components/CardPost/CardPostSkeleton"
import { Button } from "../../components/Button"
import Typography from "../../components/Typography"
import { api } from "../../services/api"
import styles from './feed.module.css'

const LIMIT = 10

export const Feed = () => {
    const [posts, setPosts] = useState([])
    const [meta, setMeta] = useState(null)
    const [tags, setTags] = useState([])
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [activeTag, setActiveTag] = useState(null)
    const [tab, setTab] = useState('all') // 'all' | 'following'
    const [sort, setSort] = useState('recent') // 'recent' | 'popular'
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(false)

    // Carrega a lista de tags (com contagem) uma vez, para "Tags em alta"
    useEffect(() => {
        api.getTags().then(setTags).catch(() => setTags([]))
    }, [])

    // Debounce da busca digitada
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    // Busca a página 1 sempre que filtros/aba/ordenação mudam
    useEffect(() => {
        let active = true
        setLoading(true)
        setError(false)
        api.getPosts({ page: 1, limit: LIMIT, search, tag: activeTag || undefined, filter: tab, sort })
            .then((res) => {
                if (!active) return
                setPosts(res.data)
                setMeta(res.meta)
            })
            .catch(() => { if (active) setError(true) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [search, activeTag, tab, sort])

    const loadMore = async () => {
        if (!meta?.hasMore || loadingMore) return
        setLoadingMore(true)
        try {
            const res = await api.getPosts({
                page: meta.page + 1,
                limit: LIMIT,
                search,
                tag: activeTag || undefined,
                filter: tab,
                sort,
            })
            setPosts((prev) => [...prev, ...res.data])
            setMeta(res.meta)
        } catch {
            // mantém o que já foi carregado
        } finally {
            setLoadingMore(false)
        }
    }

    // Like otimista: alterna likes/likedByMe na hora e reverte se a API falhar
    const handleToggleLike = useCallback(async (post) => {
        const optimistic = {
            likes: post.likedByMe ? post.likes - 1 : post.likes + 1,
            likedByMe: !post.likedByMe,
        }
        setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, ...optimistic } : p))
        )
        try {
            const res = await api.likePost(post.id)
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id ? { ...p, likes: res.likes, likedByMe: res.likedByMe } : p
                )
            )
        } catch {
            // Reverte para o estado original em caso de erro
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id ? { ...p, likes: post.likes, likedByMe: post.likedByMe } : p
                )
            )
        }
    }, [])

    const hasFilters = Boolean(search || activeTag)
    const clearFilters = () => { setSearchInput(''); setSearch(''); setActiveTag(null) }

    return (
        <div className={styles.wrapper}>
            <Toolbar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                tab={tab}
                setTab={setTab}
                sort={sort}
                setSort={setSort}
                tags={tags}
                activeTag={activeTag}
                setActiveTag={setActiveTag}
            />

            <main className={styles.main}>
                {loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CardPostSkeleton key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className={styles.message}>
                        <Typography variant="h2" color="--offwhite">
                            Não foi possível carregar os posts.
                        </Typography>
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState
                        tab={tab}
                        hasFilters={hasFilters}
                        onClear={clearFilters}
                    />
                ) : (
                    <>
                        <div className={styles.grid}>
                            {posts.map((post) => (
                                <CardPost key={post.slug} post={post} onToggleLike={handleToggleLike} />
                            ))}
                        </div>
                        {meta?.hasMore && (
                            <div className={styles.loadMore}>
                                <Button outline onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? 'Carregando...' : 'Carregar mais'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

const EmptyState = ({ tab, hasFilters, onClear }) => {
    if (hasFilters) {
        return (
            <div className={styles.message}>
                <Typography variant="body" color="--medium-gray">
                    Nenhum post encontrado para o filtro atual.
                </Typography>
                <button type="button" className={styles.clear} onClick={onClear}>
                    Limpar filtros
                </button>
            </div>
        )
    }
    if (tab === 'following') {
        return (
            <div className={styles.empty}>
                <Typography variant="h2" color="--offwhite">
                    Seu feed de seguindo está vazio.
                </Typography>
                <Typography variant="body" color="--medium-gray">
                    Siga outras pessoas para ver os projetos delas aqui.
                </Typography>
                <Button href="/people">Descobrir pessoas</Button>
            </div>
        )
    }
    return (
        <div className={styles.empty}>
            <Typography variant="h2" color="--offwhite">
                Nenhum post publicado ainda.
            </Typography>
            <Typography variant="body" color="--medium-gray">
                Que tal ser o primeiro a compartilhar um projeto?
            </Typography>
            <Button href="/post/new">Publicar primeiro projeto</Button>
        </div>
    )
}

const Toolbar = ({ searchInput, setSearchInput, tab, setTab, sort, setSort, tags, activeTag, setActiveTag }) => {
    const topTags = tags.slice(0, 12)
    return (
        <div className={styles.toolbar}>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setTab('all')}
                >
                    Para você
                </button>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === 'following' ? styles.tabActive : ''}`}
                    onClick={() => setTab('following')}
                >
                    Seguindo
                </button>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="search"
                        placeholder="Buscar por título ou descrição..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        aria-label="Buscar posts"
                    />
                </div>
                <select
                    className={styles.sort}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Ordenar posts"
                >
                    <option value="recent">Mais recentes</option>
                    <option value="popular">Mais populares</option>
                </select>
                {topTags.length > 0 && (
                    <select
                        className={styles.sort}
                        value={activeTag || ''}
                        onChange={(e) => setActiveTag(e.target.value || null)}
                        aria-label="Filtrar por tag em alta"
                    >
                        <option value="">Tags em alta</option>
                        {topTags.map(({ tag, count }) => (
                            <option key={tag} value={tag}>
                                {tag} ({count})
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    )
}
