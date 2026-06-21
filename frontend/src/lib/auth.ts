export const BACKOFFICE_KEYS = {
  token: 'backoffice_token',
  escola: 'backoffice_escola',
  nome: 'backoffice_nome',
  avatar: 'backoffice_avatar',
  mesa: 'backoffice_mesa',
  role: 'backoffice_role',
} as const;

export function getBackofficeToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BACKOFFICE_KEYS.token);
}

export function getBackofficeEscola(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BACKOFFICE_KEYS.escola);
}

/**
 * Standard headers for authenticated backoffice/admin requests.
 * Pass `{ escola: true }` to include the `x-escola-id` header.
 */
export function backofficeHeaders(opts: { escola?: boolean } = {}): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getBackofficeToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.escola) {
    const escola = getBackofficeEscola();
    if (escola) headers['x-escola-id'] = escola;
  }
  return headers;
}

export function clearBackofficeSession(): void {
  if (typeof window === 'undefined') return;
  Object.values(BACKOFFICE_KEYS).forEach((key) => localStorage.removeItem(key));
}
