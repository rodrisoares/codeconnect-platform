import styles from './avatar.module.css'

export const Avatar = ({ author, size = 32 }) => {
    if (!author) return null

    const imgSrc = author.avatar
    const initial = (author.name || author.username || '?').charAt(0).toUpperCase()

    return (
        <div
            className={styles.container}
            style={{ width: size, height: size }}
        >
            {imgSrc ? (
                <img
                    src={imgSrc}
                    width={size}
                    height={size}
                    alt={`Avatar do(a) ${author.name}`}
                />
            ) : (
                <span className={styles.fallback} style={{ fontSize: size * 0.42 }}>
                    {initial}
                </span>
            )}
        </div>
    )
}
