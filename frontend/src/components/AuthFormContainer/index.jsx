import Typography from '../Typography'
import styles from './authformcontainer.module.css'

export const AuthFormContainer = ({ children }) => {

    return (
        <div className={styles.container}>
            <aside className={styles.visual}>
                <div className={styles['visual-content']}>
                    <div className={styles.brand}>
                        <span className={styles.badge}>&lt;/&gt;</span>
                        <span className={styles['brand-name']}>Code Connect</span>
                    </div>
                    <Typography variant="h2" color="--offwhite" className={styles.tagline}>
                        A rede social de quem transforma código em conexão.
                    </Typography>
                </div>
            </aside>
            <div className={styles['form-side']}>
                <div className={styles['form-wrapper']}>
                    {children}
                </div>
            </div>
        </div>
    )
}
