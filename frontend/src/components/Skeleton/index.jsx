import styles from './skeleton.module.css'

export const Skeleton = ({ width, height, radius = 8, style }) => {
    return (
        <span
            className={styles.skeleton}
            style={{ width, height, borderRadius: radius, ...style }}
            aria-hidden="true"
        />
    )
}
