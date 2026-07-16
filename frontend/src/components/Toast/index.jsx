import { useEffect } from 'react'
import styles from './toast.module.css'

const icons = {
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
}

export const Toast = ({ message, variant = 'error', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [message, duration, onClose])

    if (!message) return null

    return (
        <div className={styles.viewport}>
            <div className={`${styles.toast} ${styles[variant]}`} role="alert">
                <span className={styles.icon}>{icons[variant]}</span>
                <span className={styles.message}>{message}</span>
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
