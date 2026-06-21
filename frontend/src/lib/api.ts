export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

/**
 * Thin fetch wrapper: prefixes the API base URL, sends/parses JSON, and throws
 * an ApiError on non-2xx responses. Adoption is incremental (see REFACTOR_PLAN).
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}
