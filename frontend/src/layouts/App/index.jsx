import { Outlet } from "react-router"
import { Aside } from "../../components/Aside"
import { Header } from "../../components/Header"
import styles from './app.module.css'

export const AppLayout = () => {
    return (
        <div className={styles.app}>
            <Aside />
            <div className={styles.content}>
                <Header />
                <div className={styles.scroll}>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
