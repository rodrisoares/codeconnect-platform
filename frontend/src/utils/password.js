// Regras de senha compartilhadas (mesmas aplicadas no backend - RegisterDto)
export const passwordRules = [
    { label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
    { label: 'Uma letra maiúscula', test: (v) => /[A-Z]/.test(v) },
    { label: 'Uma letra minúscula', test: (v) => /[a-z]/.test(v) },
    { label: 'Um número', test: (v) => /[0-9]/.test(v) },
]

export const isPasswordValid = (password = '') =>
    passwordRules.every((rule) => rule.test(password))
