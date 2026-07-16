import { Button } from "../Button"
import styles from './confirmdialog.module.css'

export const ConfirmDialog = ({
    open,
    title = 'Confirmar ação',
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                {message && <p className={styles.message}>{message}</p>}
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <Button type="button" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Aguarde...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
