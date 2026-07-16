// Formata uma data ISO em texto relativo em português ("há 2 dias").
export const formatRelativeDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const diffMs = Date.now() - date.getTime()
    const diffSec = Math.round(diffMs / 1000)

    if (diffSec < 60) return 'agora mesmo'

    const units = [
        { limit: 3600, div: 60, singular: 'minuto', plural: 'minutos' },
        { limit: 86400, div: 3600, singular: 'hora', plural: 'horas' },
        { limit: 604800, div: 86400, singular: 'dia', plural: 'dias' },
        { limit: 2592000, div: 604800, singular: 'semana', plural: 'semanas' },
        { limit: 31536000, div: 2592000, singular: 'mês', plural: 'meses' },
    ]

    for (const unit of units) {
        if (diffSec < unit.limit) {
            const amount = Math.floor(diffSec / unit.div)
            return `há ${amount} ${amount === 1 ? unit.singular : unit.plural}`
        }
    }

    const years = Math.floor(diffSec / 31536000)
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`
}

// Data absoluta legível (usada em tooltips/title).
export const formatFullDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

// Estima o tempo de leitura (~200 palavras por minuto), mínimo 1 min.
export const estimateReadingTime = (...texts) => {
    const words = texts
        .filter(Boolean)
        .join(' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    return Math.max(1, Math.round(words / 200))
}
