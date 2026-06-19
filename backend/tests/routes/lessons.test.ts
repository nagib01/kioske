import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp, instructorToken, type TestApp } from '../setup.js';
import { instructorLessonRoutes } from '../../services/api/instructor_lessons.js';

describe('Instructor Lessons API', () => {
  let test: TestApp;
  let token: string;

  beforeAll(async () => {
    test = await buildApp();
    await test.app.register(instructorLessonRoutes);
    await test.app.ready();
    token = instructorToken(test.app);
  });

  afterAll(async () => {
    await test.app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/instructor/lessons', () => {
    it('returns 200 with empty list', async () => {
      test.mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await test.app.inject({
        method: 'GET',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns 200 with lessons list', async () => {
      const fakeLessons = [
        {
          id: '1', student_id: '1', tipo: 'pratica', data: '2026-06-20',
          hora_inicio: '10:00', hora_fim: '11:00', status: 'agendada',
          student_nome: 'João', student_numero_estudante: 'ST001',
          car_matricula: 'AB-01-CD', instructor_nome: 'Instrutor',
        },
      ];
      test.mockQuery.mockResolvedValueOnce({ rows: fakeLessons, rowCount: 1 });

      const res = await test.app.inject({
        method: 'GET',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
      expect(res.json()[0].id).toBe('1');
    });
  });

  describe('POST /api/instructor/lessons', () => {
    const validLesson = {
      student_id: '1',
      tipo: 'pratica' as const,
      data: '2026-06-20',
      hora_inicio: '10:00',
      hora_fim: '11:00',
    };

    const fakeLesson = {
      id: '1', student_id: '1', tipo: 'pratica', data: '2026-06-20',
      hora_inicio: '10:00', hora_fim: '11:00', instructor_id: '2',
      status: 'agendada', car_id: null, categoria: null,
    };

    function mockLessonInsert() {
      test.mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [fakeLesson], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: '1' }], rowCount: 1 });
    }

    it('creates a lesson successfully', async () => {
      mockLessonInsert();

      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validLesson,
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBe('1');
      expect(res.json().status).toBe('agendada');
    });

    it('returns 409 when instructor has time conflict', async () => {
      test.mockQuery.mockResolvedValueOnce({ rows: [{ id: '99' }], rowCount: 1 });

      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validLesson,
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toContain('Instrutor já tem uma aula');
    });

    it('returns 409 when car has time conflict', async () => {
      test.mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: '99' }], rowCount: 1 });

      const lessonWithCar = { ...validLesson, car_id: '1' };
      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: lessonWithCar,
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toContain('viatura já está agendada');
    });

    it('returns 400 for car/category mismatch', async () => {
      test.mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ categoria: 'A' }], rowCount: 1 });

      const lessonWithMismatch = { ...validLesson, car_id: '1', categoria: 'B' };
      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: lessonWithMismatch,
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('Viatura incompatível');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { tipo: 'pratica' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 without auth token', async () => {
      const res = await test.app.inject({
        method: 'POST',
        url: '/api/instructor/lessons',
        payload: validLesson,
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
