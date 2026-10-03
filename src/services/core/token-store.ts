/** Token pair returned by login, register and refresh-token. */
export type Tokens = { access_token: string; refresh_token: string };

/** Cookie holding the refresh token, so a reload can start a new session. */
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// The access token lives only in memory: a reload drops it and the next request refreshes it.
let accessToken: string | null = null;

/** Reads the `exp` claim (seconds) of a JWT, without verifying it. */
function jwtExpiry(token: string): Date | undefined {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp === 'number' ? new Date(exp * 1000) : undefined;
  } catch {
    return undefined;
  }
}

function writeRefreshCookie(value: string, expires: Date | undefined) {
  const parts = [`${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Strict'];
  if (expires) parts.push(`Expires=${expires.toUTCString()}`);
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
}

export const tokenStore = {
  getAccessToken: () => accessToken,

  getRefreshToken(): string | null {
    if (typeof document === 'undefined') return null;
    const entry = document.cookie.split('; ').find((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`));
    return entry ? decodeURIComponent(entry.slice(REFRESH_TOKEN_COOKIE.length + 1)) : null;
  },

  setTokens({ access_token, refresh_token }: Tokens) {
    accessToken = access_token;
    writeRefreshCookie(refresh_token, jwtExpiry(refresh_token));
  },

  clear() {
    accessToken = null;
    if (typeof document !== 'undefined') writeRefreshCookie('', new Date(0));
  },
};
