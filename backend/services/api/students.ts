import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { authAdmin, authBackoffice } from '../../src/shared/auth.js';
import { resolveEscolaId } from '../../src/shared/escola.js';
import { registrarAuditoria } from '../../src/shared/auditoria.js';
import { validate, criarAlunoSchema, atualizarAlunoSchema, contactoAlunoSchema, lessonSchema, associarTicketSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';
import { StudentModel } from '../../src/models/Student.js';
import { LessonModel } from '../../src/models/Lesson.js';
import { NotificationModel } from '../../src/models/Notification.js';
import { ExamRegistrationModel } from '../../src/models/ExamRegistration.js';

export async function studentRoutes(fastify: FastifyInstance) {

  // GET /api/admin/students/dashboard - Stats dashboard
  fastify.get('/admin/students/dashboard', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = await resolveEscolaId(fastify, request, { header: true });
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
    return withDb(fastify, async (client) => {
      const data = await StudentModel.dashboard(client, escolaId);
      return reply.send(data);
    });
  });

  // GET /api/admin/students - List with search/filters
  fastify.get('/admin/students', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = await resolveEscolaId(fastify, request, { header: true, query: true });
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });

    const { search, categoria, estado_formacao, ativo, page, limit, sort, order } = request.query as any;

    return withDb(fastify, async (client) => {
      const result = await StudentModel.listar(client, escolaId, {
        search, categoria, estado_formacao,
        ativo: ativo !== undefined ? ativo === 'true' || ativo === true : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort, order
      });
      return reply.send(result);
    });
  });

  // GET /api/admin/students/:id - Student profile
  fastify.get('/admin/students/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const student = await StudentModel.buscarPorId(client, id);
      if (!student) return reply.status(404).send({ error: 'Aluno não encontrado' });
      return reply.send(student);
    });
  });

  // POST /api/admin/students - Create student
  fastify.post('/admin/students', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    let parsed: any;
    try { parsed = validate(criarAlunoSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    const escolaId = await resolveEscolaId(fastify, request, { body: true });
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é obrigatório' });

    return withDb(fastify, async (client) => {
      const senha = request.body?.senha as string | undefined;
      const senha_hash = senha ? await bcrypt.hash(senha, 10) : undefined;
      const student = await StudentModel.criar(client, escolaId, { ...parsed, senha_hash });
      await registrarAuditoria(fastify, 'criar_aluno', request.user?.id, request.user?.nome, null, { studentId: student.id, nome: student.nome });
      return reply.status(201).send(student);
    });
  });

  // PUT /api/admin/students/:id - Update student
  fastify.put('/admin/students/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    let parsed: any;
    try { parsed = validate(atualizarAlunoSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }

    return withDb(fastify, async (client) => {
      const student = await StudentModel.atualizar(client, id, parsed);
      if (!student) return reply.status(404).send({ error: 'Aluno não encontrado' });
      await registrarAuditoria(fastify, 'atualizar_aluno', request.user?.id, request.user?.nome, null, { studentId: id });
      return reply.send(student);
    });
  });

  // DELETE /api/admin/students/:id - Soft delete
  fastify.delete('/admin/students/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const ok = await StudentModel.excluir(client, id);
      if (!ok) return reply.status(404).send({ error: 'Aluno não encontrado' });
      await registrarAuditoria(fastify, 'excluir_aluno', request.user?.id, request.user?.nome, null, { studentId: id });
      return reply.send({ success: true });
    });
  });

  // ========== CONTACTS ==========

  // GET /api/admin/students/:id/contacts
  fastify.get('/admin/students/:id/contacts', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const contacts = await StudentModel.listarContactos(client, id);
      return reply.send(contacts);
    });
  });

  // POST /api/admin/students/:id/contacts
  fastify.post('/admin/students/:id/contacts', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    let parsed: any;
    try { parsed = validate(contactoAlunoSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    return withDb(fastify, async (client) => {
      const contact = await StudentModel.adicionarContacto(client, id, parsed);
      return reply.status(201).send(contact);
    });
  });

  // DELETE /api/admin/students/contacts/:contactId
  fastify.delete('/admin/students/contacts/:contactId', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { contactId } = request.params as any;
    return withDb(fastify, async (client) => {
      const ok = await StudentModel.removerContacto(client, contactId);
      if (!ok) return reply.status(404).send({ error: 'Contacto não encontrado' });
      return reply.send({ success: true });
    });
  });

  // ========== TRAINING RECORDS (LESSONS) ==========

  // GET /api/admin/students/:id/lessons
  fastify.get('/admin/students/:id/lessons', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const lessons = await LessonModel.listarPorAluno(client, id);
      return reply.send(lessons);
    });
  });

  // POST /api/admin/students/:id/lessons
  fastify.post('/admin/students/:id/lessons', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    let parsed: any;
    try { parsed = validate(lessonSchema, { ...request.body, student_id: id }); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    return withDb(fastify, async (client) => {
      const lesson = await LessonModel.criar(client, { ...parsed, student_id: id });

      await NotificationModel.criar(client, {
        student_id: id,
        tipo: 'nova_aula',
        titulo: 'Nova aula agendada',
        mensagem: `Aula de ${parsed.tipo} no dia ${parsed.data} às ${parsed.hora_inicio}`,
        lesson_id: lesson.id,
      });

      return reply.status(201).send(lesson);
    });
  });

  // DELETE /api/admin/students/lessons/:lessonId
  fastify.delete('/admin/students/lessons/:lessonId', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { lessonId } = request.params as any;
    return withDb(fastify, async (client) => {
      const ok = await LessonModel.excluir(client, lessonId);
      if (!ok) return reply.status(404).send({ error: 'Aula não encontrada' });
      return reply.send({ success: true });
    });
  });

  // ========== TICKETS ASSOCIATION ==========

  // GET /api/admin/students/:id/tickets
  fastify.get('/admin/students/:id/tickets', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const tickets = await StudentModel.tickets(client, id);
      return reply.send(tickets);
    });
  });

  // POST /api/admin/students/:id/tickets - Associate existing ticket
  fastify.post('/admin/students/:id/tickets', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    let parsed: any;
    try { parsed = validate(associarTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    return withDb(fastify, async (client) => {
      const ok = await StudentModel.associarTicket(client, parsed.ticketId, id);
      if (!ok) return reply.status(404).send({ error: 'Ticket não encontrado' });
      return reply.send({ success: true });
    });
  });

  // ========== EXAM REGISTRATIONS ==========

  // GET /api/admin/students/:id/exam-registrations
  fastify.get('/admin/students/:id/exam-registrations', async (request: any, reply) => {
    if (!(await authBackoffice(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const rows = await ExamRegistrationModel.listarPorAluno(client, id);
      return reply.send(rows);
    });
  });

  // POST /api/admin/students/:id/exam-registrations
  fastify.post('/admin/students/:id/exam-registrations', async (request: any, reply) => {
    if (!(await authBackoffice(request, reply))) return;
    const { id } = request.params as any;
    const { exam_type, exam_date, instructor_id, car_id, notes } = request.body as any;
    if (!exam_type || !['teorica', 'pratica'].includes(exam_type)) {
      return reply.status(400).send({ error: 'Tipo de exame inválido. Use "teorica" ou "pratica"' });
    }
    if (!exam_date) {
      return reply.status(400).send({ error: 'Data do exame é obrigatória' });
    }
    return withDb(fastify, async (client) => {
      const registration = await ExamRegistrationModel.criar(client, {
        student_id: id,
        exam_type, exam_date, instructor_id, car_id, notes,
      });

      await NotificationModel.criar(client, {
        student_id: id,
        tipo: 'exame_agendado',
        titulo: 'Novo exame agendado',
        mensagem: `Exame de ${exam_type === 'teorica' ? 'Teórica' : 'Prática'} agendado para ${exam_date}`,
      });

      return reply.status(201).send(registration);
    });
  });

  // PUT /api/admin/exam-registrations/:id
  fastify.put('/admin/exam-registrations/:id', async (request: any, reply) => {
    if (!(await authBackoffice(request, reply))) return;
    const { id } = request.params as any;
    const allowed = ['exam_type', 'status', 'passed', 'score', 'exam_date', 'instructor_id', 'car_id', 'notes'];
    const updates: any = {};
    for (const key of allowed) {
      if (request.body[key] !== undefined) updates[key] = request.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
    }
    return withDb(fastify, async (client) => {
      const existing = await ExamRegistrationModel.buscarPorId(client, id);
      if (!existing) return reply.status(404).send({ error: 'Registo de exame não encontrado' });

      const registration = await ExamRegistrationModel.atualizar(client, id, updates);

      if (updates.status === 'realizado' && updates.passed !== undefined) {
        await NotificationModel.criar(client, {
          student_id: existing.student_id,
          tipo: 'exame_resultado',
          titulo: 'Resultado do exame',
          mensagem: `Exame de ${existing.exam_type === 'teorica' ? 'Teórica' : 'Prática'}: ${updates.passed ? 'Aprovado' : 'Reprovado'}`,
        });
      }

      return reply.send(registration);
    });
  });

  // DELETE /api/admin/exam-registrations/:id
  fastify.delete('/admin/exam-registrations/:id', async (request: any, reply) => {
    if (!(await authBackoffice(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const ok = await ExamRegistrationModel.excluir(client, id);
      if (!ok) return reply.status(404).send({ error: 'Registo de exame não encontrado' });
      return reply.send({ success: true });
    });
  });
}
