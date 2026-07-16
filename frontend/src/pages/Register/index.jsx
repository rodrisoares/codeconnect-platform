import { AuthFormContainer } from "../../components/AuthFormContainer"
import { Input } from "../../components/Input"
import { Label } from "../../components/Label"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { IconArrowFoward } from "../../components/icons/IconArrowFoward"
import { IconLogin } from "../../components/icons/IconLogin"
import { IconUser } from "../../components/icons/IconUser"
import { IconMail } from "../../components/icons/IconMail"
import { IconLock } from "../../components/icons/IconLock"
import { Form } from "../../components/Form"
import { Fieldset } from "../../components/Fieldset"
import { Link } from "../../components/Link"
import { Toast } from "../../components/Toast"
import { PasswordRequirements } from "../../components/PasswordRequirements"
import { isPasswordValid } from "../../utils/password"
import styles from './register.module.css'
import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router"
import { useCallback, useState } from "react"

export const Register = () => {

    const { register } = useAuth()
    const navigate = useNavigate()
    const [toast, setToast] = useState({ message: '', variant: 'error' })
    const [password, setPassword] = useState('')

    const clearToast = useCallback(() => setToast((t) => ({ ...t, message: '' })), [])

    const onSubmit = async (formData) => {
        const name = formData.get('name')
        const email = formData.get('email')
        const password = formData.get('password')

        const response = await register(name, email, password)

        if (response.success) {
            // O registro já autentica o usuário (cookie httpOnly setado pelo backend).
            // Levamos para o onboarding para sugerir pessoas e tags.
            setToast({ message: 'Cadastro realizado!', variant: 'success' })
            setTimeout(() => navigate('/welcome'), 1200)
        } else {
            setToast({ message: response.error, variant: 'error' })
        }

    }

    return (
        <AuthFormContainer>
            <header className={styles.header}>
                <Typography variant="h1" color="--offwhite">Cadastro</Typography>
                <Typography variant="h2" color="--light-gray">Olá! Preencha seus dados.</Typography>
            </header>
            <Form action={onSubmit}>
                <Fieldset>
                    <Label>
                        Nome
                    </Label>
                    <Input
                        name="name"
                        id="name"
                        placeholder="Nome completo"
                        icon={<IconUser />}
                        required
                    />
                </Fieldset>
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
                        placeholder="Crie uma senha"
                        icon={<IconLock />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <PasswordRequirements password={password} />
                </Fieldset>
                <Button type="submit" disabled={!isPasswordValid(password)}>
                    Cadastrar-se <IconArrowFoward />
                </Button>
            </Form>
            <footer className={styles.footer}>
                <Typography variant="body" color="--offwhite">
                    Já tem conta?
                </Typography>
                <Link href='/auth/login'>
                    <Typography variant="body" color="--highlight-green">
                        Faça seu login!
                    </Typography>
                    <IconLogin color="#81FE88" />
                </Link>
            </footer>
            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </AuthFormContainer>
    )
}
