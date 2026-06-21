import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp, type TestApp } from '../setup.js';
import { authRoutes } from '../../services/api/auth.js';

describe('POST /api/login', () => {
  let test: TestApp;

  beforeAll(async () => {
    test = await buildApp();
    await test.app.register(authRoutes);
    await test.app.ready();
  });

  afterAll(async () => {
    await test.app.close();
  });

    it('returns 401 for invalid credentials', async () => {
    test.mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const res = await test.app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { email: 'wrong@test.com', senha: 'wrong' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Credenciais inválidas');
  });

  it('returns 400 for missing fields', async () => {
    const res = await test.app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { email: '' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

    it('returns 401 for wrong password', async () => {
    test.mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const res = await test.app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { email: 'admin@test.com', senha: 'wrongpass' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Credenciais inválidas');
  });
});
