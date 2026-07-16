import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { Input } from "../../components/Input"
import { Label } from "../../components/Label"
import { Fieldset } from "../../components/Fieldset"
import { Toast } from "../../components/Toast"
import { Spinner } from "../../components/Spinner"
import { api } from "../../services/api"
import styles from './editprofile.module.css'

export const EditProfile = () => {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [avatar, setAvatar] = useState('')
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    const showToast = (message, variant = 'error') => setToast({ message, variant })
    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    useEffect(() => {
        api.me()
            .then((profile) => {
                setName(profile.name || '')
                setUsername(profile.username || '')
                setBio(profile.bio || '')
                setAvatar(profile.avatar || '')
            })
            .catch(() => showToast('Não foi possível carregar o perfil'))
            .finally(() => setLoading(false))
    }, [])

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const result = await api.uploadImage(file)
            setAvatar(result.url)
        } catch (error) {
            showToast(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('O nome não pode ficar vazio')
            return
        }

        const payload = { name: name.trim(), bio: bio.trim() }
        if (username.trim()) payload.username = username.trim()
        if (avatar) payload.avatar = avatar

        setSubmitting(true)
        try {
            await api.updateProfile(payload)
            showToast('Perfil atualizado!', 'success')
            setTimeout(() => navigate('/profile'), 1200)
        } catch (error) {
            showToast(error.message)
            setSubmitting(false)
        }
    }

    if (loading) {
        return <Spinner />
    }

    const initial = (name || username || '?').charAt(0).toUpperCase()

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <Typography variant="h2" color="--offwhite" className={styles.heading}>
                    Editar perfil
                </Typography>

                <div className={styles.avatarRow}>
                    <div className={styles.avatar}>
                        {uploading ? (
                            <Spinner />
                        ) : avatar ? (
                            <img src={avatar} alt="Avatar" />
                        ) : (
                            <span className={styles['avatar-fallback']}>{initial}</span>
                        )}
                    </div>
                    <div className={styles.avatarActions}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className={styles['file-input']}
                        />
                        <Button outline type="button" onClick={() => fileInputRef.current?.click()}>
                            Trocar avatar ⬆
                        </Button>
                        {avatar && (
                            <button type="button" className={styles.removeAvatar} onClick={() => setAvatar('')}>
                                Remover
                            </button>
                        )}
                    </div>
                </div>

                <Fieldset>
                    <Label>Nome</Label>
                    <Input
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Fieldset>

                <Fieldset>
                    <Label>Nome de usuário</Label>
                    <Input
                        placeholder="seu_usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </Fieldset>

                <Fieldset>
                    <Label>Bio</Label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Fale um pouco sobre você (até 280 caracteres)"
                        rows={4}
                        maxLength={280}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                    <span className={styles.counter}>{bio.length}/280</span>
                </Fieldset>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={() => navigate('/profile')}
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <Button type="button" onClick={handleSave} disabled={submitting}>
                        {submitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </div>

            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </main>
    )
}
