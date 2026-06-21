import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import type { Mock } from 'vitest';

export type MockQuery = Mock<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>;

export interface TestApp {
  app: FastifyInstance;
  mockQuery: MockQuery;
  mockPoolQuery: MockQuery;
  mockRelease: Mock;
}

export async function buildApp(): Promise<TestApp> {
  const app = Fastify();

  const mockQuery = vi.fn<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>();
  const mockRelease = vi.fn();

  const mockClient = {
    query: mockQuery,
    release: mockRelease,
  };

  const mockPoolQuery = vi.fn<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>();

  app.decorate('pg', {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: mockPoolQuery,
    pool: { totalCount: 1, idleCount: 1, waitingCount: 0 },
  });

  await app.register(jwt, { secret: 'test-secret-for-kioske' });

  return { app, mockQuery, mockPoolQuery, mockRelease };
}

export function authHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}

export function makeToken(app: FastifyInstance, payload: Record<string, unknown>): string {
  return app.jwt.sign(payload);
}

export function adminToken(app: FastifyInstance): string {
  return makeToken(app, { id: '1', role: 'admin', email: 'admin@test.com', nome: 'Admin', escola_id: '1' });
}

export function instructorToken(app: FastifyInstance): string {
  return makeToken(app, { id: '2', role: 'instructor', email: 'instr@test.com', nome: 'Instrutor', escola_id: '1' });
}

export function studentToken(app: FastifyInstance): string {
  return makeToken(app, { id: '10', role: 'student', email: 'aluno@test.com', nome: 'Aluno' });
}
