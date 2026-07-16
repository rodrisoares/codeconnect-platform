import { useState } from "react"
import { Button } from "../Button"
import { MentionInput } from "../MentionInput"
import styles from './commentform.module.css'

export const CommentForm = ({ onSubmit, submitting }) => {
    const [text, setText] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        const value = text.trim()
        if (!value) return
        const ok = await onSubmit(value)
        if (ok) setText('')
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <MentionInput
                className={styles.textarea}
                placeholder="Escreva um comentário... (use @ para mencionar)"
                rows={3}
                value={text}
                onChange={setText}
            />
            <div className={styles.actions}>
                <Button type="submit" disabled={submitting || !text.trim()}>
                    {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
            </div>
        </form>
    )
}
