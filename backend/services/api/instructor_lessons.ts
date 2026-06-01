import { FastifyInstance } from 'fastify';
import { authInstructor } from '../../src/shared/auth.js';
import { validate, lessonSchema, lessonUpdateSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';
import { LessonModel } from '../../src/models/Lesson.js';
import { NotificationModel } from '../../src/models/Notification.js';

export async function instructorLessonRoutes(fastify: FastifyInstance) {

  // GET /api/instructor/dashboard - Instructor dashboard stats
  fastify.get('/api/instructor/dashboard', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const instructorId = request.user.id;
    return withDb(fastify, async (client) => {
      const data = await LessonModel.dashboardInstrutor(client, instructorId);
      return reply.send(data);
    });
  });

  // GET /api/instructor/lessons - List instructor's lessons
  fastify.get('/api/instructor/lessons', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const instructorId = request.user.id;
    const { data_inicio, data_fim, status } = request.query as any;
    return withDb(fastify, async (client) => {
      const lessons = await LessonModel.listarPorInstrutor(client, instructorId, { data_inicio, data_fim, status });
      return reply.send(lessons);
    });
  });

  // GET /api/instructor/lessons/:id - Get lesson detail
  fastify.get('/api/instructor/lessons/:id', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const lesson = await LessonModel.buscarPorId(client, id);
      if (!lesson) return reply.status(404).send({ error: 'Aula não encontrada' });
      if (lesson.instructor_id !== request.user.id && request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Acesso negado' });
      }
      return reply.send(lesson);
    });
  });

  // POST /api/instructor/lessons - Create lesson
  fastify.post('/api/instructor/lessons', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    let parsed: any;
    try { parsed = validate(lessonSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    const instructorId = request.user.id;

    return withDb(fastify, async (client) => {
      const conflitoInstrutor = await LessonModel.verificarConflitoInstrutor(
        client, instructorId, parsed.data, parsed.hora_inicio, parsed.hora_fim
      );
      if (conflitoInstrutor) {
        return reply.status(409).send({ error: 'Instrutor já tem uma aula agendada neste horário' });
      }

      if (parsed.car_id) {
        const conflitoCarro = await LessonModel.verificarConflitoCarro(
          client, parsed.car_id, parsed.data, parsed.hora_inicio, parsed.hora_fim
        );
        if (conflitoCarro) {
          return reply.status(409).send({ error: 'Esta viatura já está agendada para outra aula neste horário' });
        }
      }

      const lesson = await LessonModel.criar(client, {
        ...parsed,
        instructor_id: instructorId,
      });

      await NotificationModel.criar(client, {
        student_id: parsed.student_id,
        tipo: 'nova_aula',
        titulo: 'Nova aula agendada',
        mensagem: `Aula de ${parsed.tipo} no dia ${parsed.data} às ${parsed.hora_inicio}`,
        lesson_id: lesson.id,
      });

      return reply.status(201).send(lesson);
    });
  });

  // PUT /api/instructor/lessons/:id - Update lesson
  fastify.put('/api/instructor/lessons/:id', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const { id } = request.params as any;
    const instructorId = request.user.id;
    let parsed: any;
    try { parsed = validate(lessonUpdateSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }

    return withDb(fastify, async (client) => {
      const existing = await LessonModel.buscarPorId(client, id);
      if (!existing) return reply.status(404).send({ error: 'Aula não encontrada' });
      if (existing.instructor_id !== instructorId && request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Só pode editar as suas próprias aulas' });
      }

      const instId = existing.instructor_id || instructorId;
      const data = parsed.data || existing.data;
      const horaInicio = parsed.hora_inicio || existing.hora_inicio;
      const horaFim = parsed.hora_fim || existing.hora_fim;

      if (instId && data && horaInicio && horaFim) {
        const conflitoInstrutor = await LessonModel.verificarConflitoInstrutor(
          client, instId, data, horaInicio, horaFim, id
        );
        if (conflitoInstrutor) {
          return reply.status(409).send({ error: 'Instrutor já tem uma aula agendada neste horário' });
        }

        const carId = parsed.car_id || existing.car_id;
        if (carId) {
          const conflitoCarro = await LessonModel.verificarConflitoCarro(
            client, carId, data, horaInicio, horaFim, id
          );
          if (conflitoCarro) {
            return reply.status(409).send({ error: 'Esta viatura já está agendada para outra aula neste horário' });
          }
        }
      }

      const lesson = await LessonModel.atualizar(client, id, { ...parsed, instructor_id: existing.instructor_id });

      if (parsed.status === 'cancelada') {
        await NotificationModel.criar(client, {
          student_id: existing.student_id,
          tipo: 'aula_cancelada',
          titulo: 'Aula cancelada',
          mensagem: `Aula de ${existing.tipo} do dia ${existing.data} foi cancelada`,
          lesson_id: id,
        });
      } else if (parsed.data || parsed.hora_inicio || parsed.hora_fim) {
        await NotificationModel.criar(client, {
          student_id: existing.student_id,
          tipo: 'aula_alterada',
          titulo: 'Aula alterada',
          mensagem: `Aula de ${existing.tipo} reagendada para ${data} às ${horaInicio}`,
          lesson_id: id,
        });
      }

      return reply.send(lesson);
    });
  });

  // DELETE /api/instructor/lessons/:id - Delete lesson
  fastify.delete('/api/instructor/lessons/:id', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const existing = await LessonModel.buscarPorId(client, id);
      if (!existing) return reply.status(404).send({ error: 'Aula não encontrada' });
      if (existing.instructor_id !== request.user.id && request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Só pode remover as suas próprias aulas' });
      }
      const ok = await LessonModel.excluir(client, id);
      return reply.send({ success: true });
    });
  });
}
