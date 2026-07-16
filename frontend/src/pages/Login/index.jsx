import { AuthFormContainer } from "../../components/AuthFormContainer"
import { Checkbox } from "../../components/Checkbox"
import { Input } from "../../components/Input"
import { Label } from "../../components/Label"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { IconArrowFoward } from "../../components/icons/IconArrowFoward"
import { IconAssignement } from "../../components/icons/IconAssignement"
import { IconMail } from "../../components/icons/IconMail"
import { IconLock } from "../../components/icons/IconLock"
import { Form } from "../../components/Form"
import { Fieldset } from "../../components/Fieldset"
import { Link } from "../../components/Link"
import { Toast } from "../../components/Toast"
import styles from './login.module.css'
import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router"
import { useCallback, useState } from "react"

const REMEMBER_KEY = 'remember_email'

export const Login = () => {

    const { login } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState('')
    // Pré-preenche com o e-mail lembrado (se houver) e marca o checkbox
    const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
    const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)))

    const clearError = useCallback(() => setError(''), [])

    const onSubmit = async (formData) => {
        const password = formData.get('password')
        const response = await login(email, password)

        if (response.success) {
            // Guarda apenas o e-mail (não é segredo) para agilizar o próximo login
            if (remember) {
                localStorage.setItem(REMEMBER_KEY, email)
            } else {
                localStorage.removeItem(REMEMBER_KEY)
            }
            navigate('/')
        } else {
            setError(response.error)
        }
    }

    return (
        <AuthFormContainer>
            <header className={styles.header}>
                <Typography variant="h1" color="--offwhite">Login</Typography>
                <Typography variant="h2" color="--light-gray">Boas-vindas! Faça seu login.</Typography>
            </header>
            <Form action={onSubmit}>
                <Fieldset>
                    <Label>
                        E-mail
                    </Label>
                    <Input
                        name="email"
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        icon={<IconMail />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Fieldset>
                <Fieldset>
                    <Label>
                        Senha
                    </Label>
                    <Input
                        name="password"
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        icon={<IconLock />}
                        required
                    />
                    <Checkbox
                        label="Lembrar meu e-mail"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />
                </Fieldset>
                <Button type="submit">
                    Login <IconArrowFoward />
                </Button>
            </Form>
            <footer className={styles.footer}>
                <Typography variant="body" color="--offwhite">
                    Ainda não tem conta?
                </Typography>
                <Link href='/auth/register'>
                    <Typography variant="body" color="--highlight-green">
                        Crie seu cadastro!
                    </Typography>
                    <IconAssignement color="#81FE88" />
                </Link>
            </footer>
            <Toast message={error} variant="error" onClose={clearError} />
        </AuthFormContainer>
    )
}
