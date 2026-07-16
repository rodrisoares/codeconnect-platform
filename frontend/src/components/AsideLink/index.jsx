import styles from './asidelink.module.css'
import { NavLink } from "react-router";

const AsideLink = ({ href, children, title }) => {
    return (
        <NavLink
            to={href}
            end={href === '/'}
            title={title}
            className={({ isActive }) =>
                `${styles.asidelink} ${isActive ? styles.active : ''}`
            }
        >
            {children}
        </NavLink>
    )
}

export default AsideLink
