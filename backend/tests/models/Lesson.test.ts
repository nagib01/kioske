import { describe, it, expect, beforeEach } from 'vitest';
import { LessonModel } from '../../src/models/Lesson.js';

function mockDb(rows: unknown[] = [], rowCount = 1) {
  return { query: vi.fn().mockResolvedValue({ rows, rowCount }) };
}

describe('LessonModel', () => {
  describe('buscarPorId', () => {
    it('returns lesson with joins when found', async () => {
      const db = mockDb([{
        id: '1', student_id: '1', tipo: 'pratica', data: '2026-06-20',
        status: 'agendada', student_nome: 'João', student_numero_estudante: 'ST001',
        instructor_nome: 'Instrutor',
      }]);

      const result = await LessonModel.buscarPorId(db, '1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('1');
      expect(result!.student_nome).toBe('João');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('returns null when not found', async () => {
      const db = mockDb([], 0);
      const result = await LessonModel.buscarPorId(db, '999');
      expect(result).toBeNull();
    });
  });

  describe('criar', () => {
    it('inserts and returns a lesson', async () => {
      const fakeLesson = {
        id: '1', student_id: '1', tipo: 'pratica', data: '2026-06-20',
        hora_inicio: '10:00', hora_fim: '11:00', status: 'agendada',
      };
      const db = mockDb([fakeLesson]);

      const result = await LessonModel.criar(db, {
        student_id: '1', tipo: 'pratica', data: '2026-06-20',
        hora_inicio: '10:00', hora_fim: '11:00',
      });

      expect(result.id).toBe('1');
      expect(result.status).toBe('agendada');
    });

    it('uses default status when not provided', async () => {
      const db = mockDb([{ id: '1', student_id: '1', status: 'agendada' }]);
      await LessonModel.criar(db, {
        student_id: '1', tipo: 'pratica', data: '2026-06-20',
        hora_inicio: '10:00', hora_fim: '11:00',
      });

      const sql = db.query.mock.calls[0][0] as string;
      const params = db.query.mock.calls[0][1] as unknown[];
      const statusIdx = sql.split(',').findIndex((s: string) => s.includes('status'));
      expect(params[8]).toBe('agendada');
    });
  });

  describe('listarPorInstrutor', () => {
    it('lists lessons for an instructor', async () => {
      const db = mockDb([
        { id: '1', student_id: '1', data: '2026-06-20', status: 'agendada', student_nome: 'João' },
        { id: '2', student_id: '2', data: '2026-06-21', status: 'agendada', student_nome: 'Maria' },
      ]);

      const result = await LessonModel.listarPorInstrutor(db, '2');
      expect(result).toHaveLength(2);
    });
  });

  describe('verificarConflitoInstrutor', () => {
    it('returns false when no conflict exists', async () => {
      const db = mockDb([], 0);
      const result = await LessonModel.verificarConflitoInstrutor(db, '2', '2026-06-20', '10:00', '11:00');
      expect(result).toBe(false);
    });

    it('returns true when conflict exists', async () => {
      const db = mockDb([{ id: '99' }], 1);
      const result = await LessonModel.verificarConflitoInstrutor(db, '2', '2026-06-20', '10:00', '11:00');
      expect(result).toBe(true);
    });
  });

  describe('verificarConflitoCarro', () => {
    it('returns false when no car conflict', async () => {
      const db = mockDb([], 0);
      const result = await LessonModel.verificarConflitoCarro(db, '1', '2026-06-20', '10:00', '11:00');
      expect(result).toBe(false);
    });
  });

  describe('excluir', () => {
    it('returns true when deleted', async () => {
      const db = mockDb([{ id: '1' }], 1);
      const result = await LessonModel.excluir(db, '1');
      expect(result).toBe(true);
    });

    it('returns false when nothing to delete', async () => {
      const db = mockDb([], 0);
      const result = await LessonModel.excluir(db, '999');
      expect(result).toBe(false);
    });
  });
});
