import { Link } from "react-router"
import { Avatar } from "../Avatar"
import styles from './author.module.css'

export const Author = ({ author }) => {
    if (!author) return null

    const content = (
        <ul className={styles.author}>
            <li>
                <Avatar author={author} />
            </li>
            <li>
                @{author.username || author.name}
            </li>
        </ul>
    )

    if (!author.id) return content

    return (
        <Link
            to={`/user/${author.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            {content}
        </Link>
    )
}
