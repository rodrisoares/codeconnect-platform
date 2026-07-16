import styles from './form.module.css'

export const Form = ({ children, ...props }) => {
    return (
        <form className={styles.form} {...props}>
            {children}
        </form>
    )
}