import { useState } from 'react'
import logo from './logo.png'
import AsideLink from '../AsideLink'
import { IconFeed } from '../icons/IconFeed'
import { IconAccount } from '../icons/IconAccount'
import { IconInfo } from '../icons/IconInfo'
import { IconLogin } from '../icons/IconLogin'
import { IconUsers } from '../icons/IconUsers'
import { IconBookmark } from '../icons/IconBookmark'
import { Button } from '../Button'
import { Link } from '../Link'

import styles from './aside.module.css'

const ChevronIcon = ({ collapsed }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
)

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
)

export const Aside = () => {
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem('aside_collapsed') === '1'
    )

    const toggle = () =>
        setCollapsed((c) => {
            const next = !c
            localStorage.setItem('aside_collapsed', next ? '1' : '0')
            return next
        })

    return (
        <aside className={`${styles.aside} ${collapsed ? styles.collapsed : ''}`}>
            <button
                type="button"
                className={styles.toggle}
                onClick={toggle}
                aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                title={collapsed ? 'Expandir' : 'Recolher'}
                aria-expanded={!collapsed}
            >
                <ChevronIcon collapsed={collapsed} />
            </button>
            <nav>
                <ul>
                    <li>
                        <Link href="/">
                            <img src={logo} alt="Logo da Code Connect" />
                        </Link>
                    </li>
                    <li>
                        <Button
                            href="/post/new"
                            outline
                            title={collapsed ? 'Publicar' : undefined}
                            aria-label="Publicar"
                        >
                            {collapsed ? (
                                <span className={styles.plus}><PlusIcon /></span>
                            ) : (
                                'Publicar'
                            )}
                        </Button>
                    </li>
                    <li>
                        <AsideLink href="/" title={collapsed ? 'Feed' : undefined}>
                            <IconFeed />
                            <span className={styles.label}>Feed</span>
                        </AsideLink>
                    </li>
                    <li>
                        <AsideLink href="/people" title={collapsed ? 'Descobrir' : undefined}>
                            <IconUsers />
                            <span className={styles.label}>Descobrir</span>
                        </AsideLink>
                    </li>
                    <li>
                        <AsideLink href="/saved" title={collapsed ? 'Salvos' : undefined}>
                            <IconBookmark size={24} />
                            <span className={styles.label}>Salvos</span>
                        </AsideLink>
                    </li>
                    <li>
                        <AsideLink href="/profile" title={collapsed ? 'Perfil' : undefined}>
                            <IconAccount />
                            <span className={styles.label}>Perfil</span>
                        </AsideLink>
                    </li>
                    <li>
                        <AsideLink href="/about" title={collapsed ? 'Sobre nós' : undefined}>
                            <IconInfo />
                            <span className={styles.label}>Sobre nós</span>
                        </AsideLink>
                    </li>
                    <li>
                        <AsideLink href="/auth/logout" title={collapsed ? 'Logout' : undefined}>
                            <IconLogin />
                            <span className={styles.label}>Logout</span>
                        </AsideLink>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}
