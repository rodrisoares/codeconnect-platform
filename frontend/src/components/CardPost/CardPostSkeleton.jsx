import { Skeleton } from '../Skeleton'
import styles from './cardpost.module.css'

export const CardPostSkeleton = () => {
    return (
        <article className={styles.card} aria-hidden="true">
            <header className={styles.header}>
                <Skeleton width="100%" height="133px" radius={4} />
            </header>
            <section className={styles.body}>
                <Skeleton width="70%" height="20px" />
                <Skeleton width="100%" height="14px" />
                <Skeleton width="90%" height="14px" />
                <div className={styles.tags}>
                    <Skeleton width="56px" height="22px" radius={999} />
                    <Skeleton width="64px" height="22px" radius={999} />
                </div>
            </section>
            <footer className={styles.footer}>
                <Skeleton width="120px" height="16px" />
                <Skeleton width="100px" height="32px" radius={999} />
            </footer>
        </article>
    )
}
