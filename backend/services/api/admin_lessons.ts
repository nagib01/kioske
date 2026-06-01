import { FastifyInstance } from 'fastify';
import { authAdmin } from '../../src/shared/auth.js';
import { getDefaultEscolaId } from '../../src/shared/escola.js';
import { withDb } from '../../src/shared/db.js';
import { LessonModel } from '../../src/models/Lesson.js';

export async function adminLessonRoutes(fastify: FastifyInstance) {

  // GET /admin/lessons - List all lessons with filters
  fastify.get('/admin/lessons', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });

    const { search, instructor_id, student_id, car_id, data_inicio, data_fim, status, page, limit, sort, order } = request.query as any;

    return withDb(fastify, async (client) => {
      const result = await LessonModel.listarTodos(client, escolaId, {
        search, instructor_id, student_id, car_id, data_inicio, data_fim, status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort, order,
      });
      return reply.send(result);
    });
  });

  // GET /admin/lessons/export - Export lessons as CSV
  fastify.get('/admin/lessons/export', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });

    const { search, instructor_id, student_id, car_id, data_inicio, data_fim, status } = request.query as any;

    return withDb(fastify, async (client) => {
      const result = await LessonModel.listarTodos(client, escolaId, {
        search, instructor_id, student_id, car_id, data_inicio, data_fim, status,
        page: 1,
        limit: 10000,
      });

      const headers = ['Data', 'Hora Início', 'Hora Fim', 'Aluno', 'Nº Estudante', 'Instrutor', 'Carro', 'Tipo', 'Status', 'Sumário'];
      const rows = result.lessons.map((l: any) => [
        l.data,
        l.hora_inicio ? l.hora_inicio.substring(0, 5) : '',
        l.hora_fim ? l.hora_fim.substring(0, 5) : '',
        l.student_nome,
        l.student_numero_estudante,
        l.instructor_nome || '',
        l.car_matricula || '',
        l.tipo === 'pratica' ? 'Prática' : 'Teórica',
        l.status,
        l.summary || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

      const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="aulas_${new Date().toISOString().split('T')[0]}.csv"`);
      return reply.send(csv);
    });
  });

  // GET /admin/lessons/:id - Lesson detail
  fastify.get('/admin/lessons/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const lesson = await LessonModel.buscarPorId(client, id);
      if (!lesson) return reply.status(404).send({ error: 'Aula não encontrada' });
      return reply.send(lesson);
    });
  });
}
