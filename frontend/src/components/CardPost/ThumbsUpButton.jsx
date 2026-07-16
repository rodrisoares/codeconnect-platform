import { IconButton } from "../IconButton"
import { Spinner } from "../Spinner"
import { IconThumbsUp } from "../icons/IconThumbsUp"

export const ThumbsUpButton = ({ loading }) => {
    return (
        <IconButton disabled={loading}>
            { loading ? <Spinner /> : <IconThumbsUp /> }
        </IconButton>
    )
}