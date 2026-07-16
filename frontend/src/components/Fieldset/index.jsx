import styles from './fieldset.module.css'

export const Fieldset = ({ children, ...props }) => {
    return (
        <fieldset className={styles.fieldset} {...props}>
            {children}
        </fieldset>
    )
}