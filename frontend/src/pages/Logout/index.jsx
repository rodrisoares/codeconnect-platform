import { useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router"

export const Logout = () => {

    const { logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        logout().finally(() => navigate('/auth/login'))
    }, [logout, navigate])

    return null

}