import { Link } from "react-router"
import styles from './mentiontext.module.css'

// Renderiza o texto transformando @username em link para o perfil.
export const MentionText = ({ text }) => {
    const parts = String(text ?? '').split(/(@[a-zA-Z0-9_.]+)/g)
    return (
        <>
            {parts.map((part, i) => {
                if (/^@[a-zA-Z0-9_.]+$/.test(part)) {
                    const username = part.slice(1)
                    return (
                        <Link key={i} to={`/user/${username}`} className={styles.mention}>
                            {part}
                        </Link>
                    )
                }
                return part
            })}
        </>
    )
}
