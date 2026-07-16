import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import ReactMarkdown from 'react-markdown'
import Typography from "../../components/Typography"
import { Button } from "../../components/Button"
import { Input } from "../../components/Input"
import { Label } from "../../components/Label"
import { Fieldset } from "../../components/Fieldset"
import { Toast } from "../../components/Toast"
import { Spinner } from "../../components/Spinner"
import { api } from "../../services/api"
import styles from './createpost.module.css'

export const CreatePost = () => {
    const navigate = useNavigate()
    const { slug } = useParams()
    const isEditing = Boolean(slug)
    const fileInputRef = useRef(null)

    const [postId, setPostId] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [markdown, setMarkdown] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [cover, setCover] = useState('')
    const [filename, setFilename] = useState('')
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(isEditing)
    const [toast, setToast] = useState({ message: '', variant: 'error' })

    const showError = (message) => setToast({ message, variant: 'error' })
    const showSuccess = (message) => setToast({ message, variant: 'success' })
    const clearToast = () => setToast((t) => ({ ...t, message: '' }))

    // Modo edição: carrega o post existente e preenche o formulário
    useEffect(() => {
        if (!isEditing) return
        let active = true
        api.getPostBySlug(slug)
            .then((post) => {
                if (!active) return
                setPostId(post.id)
                setTitle(post.title || '')
                setDescription(post.body || '')
                setMarkdown(post.markdown || '')
                setTags(Array.isArray(post.tags) ? post.tags : [])
                setCover(post.cover || '')
            })
            .catch(() => { if (active) navigate('/not-found') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [slug, isEditing, navigate])

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const result = await api.uploadImage(file)
            setCover(result.url)
            setFilename(result.filename)
        } catch (error) {
            showError(error.message)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = () => {
        setCover('')
        setFilename('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleTagKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            const value = tagInput.trim()
            if (value && !tags.includes(value)) {
                setTags((prev) => [...prev, value])
            }
            setTagInput('')
        }
    }

    const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag))

    const handleSubmit = async (status = 'PUBLISHED') => {
        if (!title.trim() || !description.trim()) {
            showError('Preencha o nome e a descrição do projeto')
            return
        }
        if (!cover) {
            showError('Carregue uma imagem para o projeto')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                cover,
                title: title.trim(),
                body: description.trim(),
                tags,
                markdown: markdown.trim() || undefined,
                status,
            }
            if (isEditing) {
                const updated = await api.updatePost(postId, payload)
                showSuccess(status === 'DRAFT' ? 'Rascunho atualizado!' : 'Alterações publicadas!')
                const to = status === 'DRAFT' ? '/profile' : `/blog-post/${updated.slug}`
                setTimeout(() => navigate(to), 1000)
            } else {
                await api.createPost(payload)
                showSuccess(status === 'DRAFT' ? 'Rascunho salvo!' : 'Projeto publicado com sucesso!')
                setTimeout(() => navigate('/profile'), 1000)
            }
            // Mantém os botões desabilitados até a navegação (evita envio duplo)
        } catch (error) {
            showError(error.message)
            setSubmitting(false)
        }
    }

    const handleDiscard = () => navigate(-1)

    if (loading) {
        return <Spinner />
    }

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <div className={styles.left}>
                    <div
                        className={styles.preview}
                        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                    >
                        {uploading && <Spinner />}
                        {!uploading && !cover && (
                            <Typography variant="body" color="--medium-gray">
                                Pré-visualização da imagem
                            </Typography>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles['file-input']}
                        id="cover-upload"
                    />
                    <Button
                        outline
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Carregar imagem ⬆
                    </Button>

                    {filename && (
                        <div className={styles.filename}>
                            <span>{filename}</span>
                            <button type="button" onClick={removeImage} aria-label="Remover imagem">
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.right}>
                    <Typography variant="h2" color="--offwhite" className={styles.heading}>
                        {isEditing ? 'Editar projeto' : 'Novo projeto'}
                    </Typography>

                    <Fieldset>
                        <Label>Nome do projeto</Label>
                        <Input
                            placeholder="React zero to hero"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Fieldset>

                    <Fieldset>
                        <Label>Descrição</Label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Descreva o seu projeto"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <span className={styles.counter}>{description.length} caracteres</span>
                    </Fieldset>

                    <Fieldset>
                        <Label>Tags</Label>
                        <Input
                            placeholder="Digite uma tag e pressione Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                        {tags.length > 0 && (
                            <div className={styles.tags}>
                                {tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remover ${tag}`}>
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </Fieldset>
                </div>
            </div>

            {/* Editor de conteúdo (markdown) com preview lado a lado */}
            <div className={styles.editorCard}>
                <Typography variant="h3" color="--offwhite" className={styles.heading}>
                    Conteúdo (Markdown)
                </Typography>
                <div className={styles.editorGrid}>
                    <Fieldset>
                        <Label>Editor</Label>
                        <textarea
                            className={styles.codeArea}
                            placeholder={"# Título\n\n```js\nconsole.log('Olá, mundo!')\n```"}
                            rows={14}
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                        />
                        <span className={styles.counter}>
                            {markdown.length} caracteres · {markdown.trim() ? markdown.trim().split(/\s+/).length : 0} palavras
                        </span>
                    </Fieldset>
                    <div className={styles.previewPane}>
                        <Label>Pré-visualização</Label>
                        <div className={styles.previewContent}>
                            {markdown.trim() ? (
                                <ReactMarkdown>{markdown}</ReactMarkdown>
                            ) : (
                                <Typography variant="body" color="--medium-gray">
                                    A pré-visualização aparecerá aqui.
                                </Typography>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.discard}
                        onClick={handleDiscard}
                        disabled={submitting}
                    >
                        Descartar 🗑
                    </button>
                    <button
                        type="button"
                        className={styles.draft}
                        onClick={() => handleSubmit('DRAFT')}
                        disabled={submitting}
                    >
                        Salvar rascunho
                    </button>
                    <Button type="button" onClick={() => handleSubmit('PUBLISHED')} disabled={submitting}>
                        {submitting
                            ? (isEditing ? 'Salvando...' : 'Publicando...')
                            : (isEditing ? 'Publicar alterações' : 'Publicar ⬆')}
                    </Button>
                </div>
            </div>

            <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        </main>
    )
}
