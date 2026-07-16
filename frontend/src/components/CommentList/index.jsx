import { Comment } from "../Comment"
import { countComments } from "../../utils/comments"
import styles from './commentlist.module.css'

export const CommentList = ({ comments, total, currentUserId, onUpdate, onDelete, onReply }) => {
    const count = total ?? countComments(comments)
    return (
        <section className={styles.comments}>
            <h2>
                Comentários ({count})
            </h2>
            {comments.length === 0 ? (
                <p className={styles.empty}>Seja o primeiro a comentar.</p>
            ) : (
                <ul>
                    {comments.map((comment) => (
                        <li key={comment.id}>
                            <Comment
                                comment={comment}
                                currentUserId={currentUserId}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onReply={onReply}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
