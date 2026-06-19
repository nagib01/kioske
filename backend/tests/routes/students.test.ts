import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp, adminToken, type TestApp } from '../setup.js';
import { studentRoutes } from '../../services/api/students.js';

describe('Admin Student API', () => {
  let test: TestApp;
  let token: string;

  beforeAll(async () => {
    test = await buildApp();
    await test.app.register(studentRoutes);
    await test.app.ready();
    token = adminToken(test.app);
  });

  afterAll(async () => {
    await test.app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /admin/students', () => {
    it('lists students with pagination', async () => {
      test.mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            { id: '1', nome: 'João Silva', numero_estudante: 'ST001', email: 'joao@test.com', categoria: 'B', estado_formacao: 'em_formacao', ativo: true, data_matricula: '2026-01-15', created_at: '2026-01-15T00:00:00Z' },
            { id: '2', nome: 'Maria Costa', numero_estudante: 'ST002', email: 'maria@test.com', categoria: 'B', estado_formacao: 'inscrito', ativo: true, data_matricula: '2026-02-01', created_at: '2026-02-01T00:00:00Z' },
          ],
          rowCount: 2,
        });

      const res = await test.app.inject({
        method: 'GET',
        url: '/admin/students?page=1&limit=20',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.students).toHaveLength(2);
      expect(body.total).toBe(5);
      expect(body.students[0].nome).toBe('João Silva');
    });
  });

  describe('POST /admin/students', () => {
    it('creates a student', async () => {
      test.mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: '3', nome: 'Novo Aluno', numero_estudante: 'ST003', email: 'novo@test.com', categoria: 'B' }],
          rowCount: 1,
        });

      const res = await test.app.inject({
        method: 'POST',
        url: '/admin/students',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          numero_estudante: 'ST003',
          nome: 'Novo Aluno',
          email: 'novo@test.com',
          categoria: 'B',
          senha: 'test123',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().nome).toBe('Novo Aluno');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await test.app.inject({
        method: 'POST',
        url: '/admin/students',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nome: 'Incomplete' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /admin/students/:id/lessons', () => {
    it('creates a lesson for a student', async () => {
      const fakeLesson = {
        id: '5', student_id: '1', tipo: 'pratica', data: '2026-06-20',
        hora_inicio: '14:00', hora_fim: '15:00', status: 'agendada',
      };

      test.mockQuery
        .mockResolvedValueOnce({ rows: [fakeLesson], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: '1' }], rowCount: 1 });

      const res = await test.app.inject({
        method: 'POST',
        url: '/admin/students/1/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tipo: 'pratica',
          data: '2026-06-20',
          hora_inicio: '14:00',
          hora_fim: '15:00',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBe('5');
    });
  });
});
