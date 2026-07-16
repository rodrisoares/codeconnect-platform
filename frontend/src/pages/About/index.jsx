import { useEffect, useState } from "react"
import Typography from "../../components/Typography"
import { Spinner } from "../../components/Spinner"
import { api } from "../../services/api"
import logo from "../../components/Aside/logo.png"
import styles from './about.module.css'

export const About = () => {
    const [about, setAbout] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.getAbout()
            .then(setAbout)
            .catch(() => setAbout(null))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <Spinner />
    }

    if (!about) {
        return (
            <main className={styles.main}>
                <Typography variant="h2" color="--offwhite">
                    Não foi possível carregar o conteúdo.
                </Typography>
            </main>
        )
    }

    return (
        <main className={styles.main}>
            <section
                className={styles.hero}
                style={about.hero.image ? { backgroundImage: `url(${about.hero.image})` } : undefined}
            >
                <div className={styles['hero-overlay']} />
            </section>

            <header className={styles.intro}>
                <Typography variant="h1" color="--highlight-green" className={styles.title}>
                    {about.hero.title}
                </Typography>
                <Typography variant="h2" color="--pastel-green" className={styles.subtitle}>
                    {about.hero.subtitle}
                </Typography>
                <Typography variant="body" color="--light-gray" className={styles.paragraph}>
                    {about.intro}
                </Typography>
            </header>

            {about.sections.map((section, index) => (
                <section
                    key={section.title}
                    className={`${styles.section} ${section.image && index % 2 !== 0 ? styles.reverse : ''}`}
                >
                    <div className={styles['section-text']}>
                        <Typography variant="h3" color="--highlight-green">
                            {section.title}
                        </Typography>
                        <Typography variant="body" color="--light-gray" className={styles.paragraph}>
                            {section.content}
                        </Typography>
                    </div>
                    {section.image && (
                        <div
                            className={styles['section-image']}
                            style={{ backgroundImage: `url(${section.image})` }}
                        />
                    )}
                </section>
            ))}

            <footer className={styles.cta}>
                <img src={logo} alt="Code Connect" className={styles['cta-logo']} />
                <Typography variant="h3" color="--offwhite" className={styles['cta-text']}>
                    {about.cta}
                </Typography>
            </footer>
        </main>
    )
}
