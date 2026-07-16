import styles from './button.module.css';

export const Button = ({ children, outline, href, ...rest }) => {
    if (href) {
        return (
            <a href={href} className={outline ? styles.outline : styles.btn} {...rest}>
                {children}
            </a>
        );
    }

    return (
        <button className={outline ? styles.outline : styles.btn} {...rest}>
            {children}
        </button>
    );
}