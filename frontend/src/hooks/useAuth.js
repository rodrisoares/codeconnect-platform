// Mantido por compatibilidade: o estado de autenticação agora vive no
// AuthContext (fonte única de verdade). Reexportamos o hook para não
// precisar alterar os imports existentes.
export { useAuth } from '../context/AuthContext'
