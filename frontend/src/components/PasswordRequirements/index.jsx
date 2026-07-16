import styles from './passwordrequirements.module.css'
import { passwordRules } from '../../utils/password'

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

const DotIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
    </svg>
)

export const PasswordRequirements = ({ password = '' }) => {
    return (
        <ul className={styles.list} aria-label="Requisitos da senha">
            {passwordRules.map((rule) => {
                const met = rule.test(password)
                return (
                    <li
                        key={rule.label}
                        className={`${styles.item} ${met ? styles.met : ''}`}
                    >
                        <span className={styles.icon}>
                            {met ? <CheckIcon /> : <DotIcon />}
                        </span>
                        {rule.label}
                    </li>
                )
            })}
        </ul>
    )
}
