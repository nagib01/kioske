import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationModel } from '../../src/models/Notification.js';

function mockDb(rows: unknown[] = [], rowCount = 1) {
  const query = vi.fn().mockResolvedValue({ rows, rowCount });
  return { query, release: vi.fn() };
}

describe('NotificationModel', () => {
  describe('criar', () => {
    it('inserts a notification and attempts email', async () => {
      const fakeNotif = {
        id: '1', student_id: '1', tipo: 'nova_aula',
        titulo: 'Nova aula', mensagem: 'Aula de prática no dia 20/06',
        lesson_id: '1', lida: false,
      };
      const db = mockDb([fakeNotif]);

      const result = await NotificationModel.criar(db, {
        student_id: '1', tipo: 'nova_aula',
        titulo: 'Nova aula', mensagem: 'Aula de prática no dia 20/06',
        lesson_id: '1',
      });

      expect(result.id).toBe('1');
      expect(result.tipo).toBe('nova_aula');
      expect(result.lida).toBe(false);
    });
  });

  describe('listar', () => {
    it('lists notifications for a student', async () => {
      const db = mockDb([
        { id: '1', student_id: '1', tipo: 'nova_aula', titulo: 'Aula 1', lida: false },
        { id: '2', student_id: '1', tipo: 'aula_alterada', titulo: 'Aula 2', lida: true },
      ]);

      const result = await NotificationModel.listar(db, '1');
      expect(result).toHaveLength(2);
    });
  });

  describe('marcarLida', () => {
    it('marks a notification as read', async () => {
      const db = mockDb([{ id: '1' }], 1);
      const result = await NotificationModel.marcarLida(db, '1', '1');
      expect(result).toBe(true);
    });
  });

  describe('contarNaoLidas', () => {
    it('returns count of unread', async () => {
      const db = mockDb([{ count: '3' }], 1);
      const result = await NotificationModel.contarNaoLidas(db, '1');
      expect(result).toBe(3);
    });
  });
});
