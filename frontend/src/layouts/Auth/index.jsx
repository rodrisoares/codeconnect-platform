import { Outlet } from 'react-router'
import styles from './auth.module.css'

export const AuthLayout = () => {
    return (
        <div className={styles.container}>
            <Outlet />
        </div>
    )
}
