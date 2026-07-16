import { useState } from 'react'
import styles from './input.module.css'
import { IconEye } from '../icons/IconEye'
import { IconEyeOff } from '../icons/IconEyeOff'

export const Input = ({ icon, type = 'text', ...props }) => {
    const isPassword = type === 'password'
    const [visible, setVisible] = useState(false)
    const inputType = isPassword ? (visible ? 'text' : 'password') : type

    return (
        <div className={styles.wrapper}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <input
                className={styles.input}
                type={inputType}
                data-has-icon={icon ? 'true' : undefined}
                data-has-action={isPassword ? 'true' : undefined}
                {...props}
            />
            {isPassword && (
                <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                >
                    {visible ? <IconEyeOff /> : <IconEye />}
                </button>
            )}
        </div>
    )
}
