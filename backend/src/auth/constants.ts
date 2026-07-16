export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'secretKey',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refreshSecretKey',
  accessExpiresIn: '24h',
  refreshExpiresIn: '7d',
};

// Nomes dos cookies usados na autenticação
export const authCookies = {
  access: 'access_token',
  refresh: 'refresh_token',
  // Cookie legível (não-httpOnly, sem segredo) indicando que há sessão
  hint: 'has_session',
};

const isProd = process.env.NODE_ENV === 'production';
const DAY = 24 * 60 * 60 * 1000;

// Opções base dos cookies. SameSite=Lax + same-origin (via proxy do Vite)
// mitigam CSRF. secure=true apenas em produção (HTTPS).
export const cookieBaseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
};

export const accessCookieMaxAge = DAY; // 24h (igual ao access token)
export const refreshCookieMaxAge = 7 * DAY; // 7 dias (igual ao refresh token)
