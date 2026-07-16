import { useEffect, useRef, useState } from "react"
import { Avatar } from "../Avatar"
import { api } from "../../services/api"
import styles from './mentioninput.module.css'

// Textarea com autocomplete de menções: ao digitar "@" abre uma lista de
// usuários (busca por username) para inserir @username.
export const MentionInput = ({ value, onChange, placeholder, rows = 3, className }) => {
    const ref = useRef(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [active, setActive] = useState(0)
    const mentionStart = useRef(null)

    // Busca sugestões (debounce) quando há um token de menção ativo
    useEffect(() => {
        if (!open) return
        const timer = setTimeout(() => {
            api.discoverUsers(query)
                .then((list) => {
                    const withUsername = (Array.isArray(list) ? list : []).filter((u) => u.username)
                    setSuggestions(withUsername.slice(0, 6))
                    setActive(0)
                })
                .catch(() => setSuggestions([]))
        }, 200)
        return () => clearTimeout(timer)
    }, [query, open])

    // Detecta o token @xxx imediatamente antes do cursor
    const detectMention = (text, caret) => {
        const before = text.slice(0, caret)
        const match = before.match(/(?:^|\s)@([a-zA-Z0-9_.]*)$/)
        if (match) {
            mentionStart.current = caret - match[1].length - 1
            setQuery(match[1])
            setOpen(true)
        } else {
            setOpen(false)
            mentionStart.current = null
        }
    }

    const handleChange = (e) => {
        const text = e.target.value
        onChange(text)
        detectMention(text, e.target.selectionStart)
    }

    const insertMention = (username) => {
        const el = ref.current
        const caret = el ? el.selectionStart : value.length
        const start = mentionStart.current ?? caret
        const next = `${value.slice(0, start)}@${username} ${value.slice(caret)}`
        onChange(next)
        setOpen(false)
        mentionStart.current = null
        // Reposiciona o cursor após a menção inserida
        requestAnimationFrame(() => {
            if (el) {
                const pos = start + username.length + 2
                el.focus()
                el.setSelectionRange(pos, pos)
            }
        })
    }

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault()
            insertMention(suggestions[active].username)
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div className={styles.wrapper}>
            <textarea
                ref={ref}
                className={className}
                placeholder={placeholder}
                rows={rows}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && suggestions.length > 0 && (
                <ul className={styles.dropdown}>
                    {suggestions.map((u, i) => (
                        <li key={u.id}>
                            <button
                                type="button"
                                className={`${styles.item} ${i === active ? styles.active : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); insertMention(u.username) }}
                            >
                                <Avatar author={u} size={28} />
                                <span className={styles.identity}>
                                    <strong>@{u.username}</strong>
                                    <span className={styles.name}>{u.name}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
