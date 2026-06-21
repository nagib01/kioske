import { describe, it, expect, afterEach, vi } from 'vitest';
import { apiUrl, ApiError, apiFetch } from '../../lib/api';

function mockResponse(opts: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  contentType?: string;
}): Response {
  const { ok = true, status = 200, json, contentType = 'application/json' } = opts;
  return {
    ok,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => json,
    text: async () => (typeof json === 'string' ? json : JSON.stringify(json)),
  } as unknown as Response;
}

describe('apiUrl', () => {
  it('prefixes the path with the API base', () => {
    expect(apiUrl('/foo')).toMatch(/\/foo$/);
  });
});

describe('ApiError', () => {
  it('carries status, message and body', () => {
    const err = new ApiError(404, 'nope', { x: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe('nope');
    expect(err.body).toEqual({ x: 1 });
  });
});

describe('apiFetch', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed JSON on success', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ json: { a: 1 } }));
    await expect(apiFetch('/x')).resolves.toEqual({ a: 1 });
  });

  it('throws an ApiError with the server message on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ ok: false, status: 400, json: { error: 'bad' } }));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 400, message: 'bad' });
  });
});
