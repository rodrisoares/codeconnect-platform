import { useEffect, useState } from "react"
import { api } from "../../services/api"
import styles from './contributiongraph.module.css'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const level = (c) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : 3)

// Heatmap de atividade (posts + comentários) dos últimos 12 meses.
export const ContributionGraph = ({ userId }) => {
    const [data, setData] = useState(null)

    useEffect(() => {
        if (!userId) return
        let active = true
        api.getUserActivity(userId)
            .then((res) => { if (active) setData(res) })
            .catch(() => { if (active) setData({ days: [] }) })
        return () => { active = false }
    }, [userId])

    if (!data) return null

    const countByDate = new Map((data.days || []).map((d) => [d.date, d.count]))
    const total = (data.days || []).reduce((s, d) => s + d.count, 0)

    // Monta as células de start (alinhado ao domingo) até hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    start.setDate(start.getDate() - start.getDay()) // volta ao domingo

    const weeks = []
    const cur = new Date(start)
    while (cur <= today) {
        const week = []
        for (let d = 0; d < 7; d++) {
            const key = cur.toISOString().slice(0, 10)
            week.push({ key, count: countByDate.get(key) || 0, month: cur.getMonth(), date: cur.getDate() })
            cur.setDate(cur.getDate() + 1)
        }
        weeks.push(week)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <span>{total} contribuições no último ano</span>
                <span className={styles.legend}>
                    Menos
                    <i className={styles.l0} />
                    <i className={styles.l1} />
                    <i className={styles.l2} />
                    <i className={styles.l3} />
                    Mais
                </span>
            </div>
            <div className={styles.graph}>
                {weeks.map((week, wi) => (
                    <div key={wi} className={styles.week}>
                        {/* rótulo do mês quando muda no topo da coluna */}
                        {week[0].date <= 7 && (
                            <span className={styles.month}>{MONTHS[week[0].month]}</span>
                        )}
                        {week.map((cell) => (
                            <span
                                key={cell.key}
                                className={`${styles.cell} ${styles[`l${level(cell.count)}`]}`}
                                title={`${cell.count} contribuição(ões) em ${cell.key}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
