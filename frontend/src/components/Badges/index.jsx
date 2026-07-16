import styles from './badges.module.css'

// Lista de conquistas do perfil (derivadas dos números, vindas da API).
export const Badges = ({ badges }) => {
    if (!badges || badges.length === 0) return null
    return (
        <div className={styles.badges}>
            {badges.map((b) => (
                <span key={b.id} className={styles.badge} title={b.label}>
                    <span className={styles.emoji}>{b.emoji}</span>
                    {b.label}
                </span>
            ))}
        </div>
    )
}
