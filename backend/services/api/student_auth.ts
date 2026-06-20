import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { validate, studentLoginEmailSchema, studentRefreshSchema, studentChangePasswordSchema } from '../../src/shared/validation.js';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY = '15m';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

async function checkBruteForce(fastify: FastifyInstance, studentId: string): Promise<boolean> {
  const res = await fastify.pg.query(
    `SELECT login_attempts, locked_until FROM students WHERE id = $1`,
    [studentId]
  );
  const student = res.rows[0];
  if (!student) return false;
  if (student.locked_until && new Date(student.locked_until) > new Date()) {
    return true;
  }
  if (student.locked_until && new Date(student.locked_until) <= new Date()) {
    await fastify.pg.query(
      `UPDATE students SET login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [studentId]
    );
  }
  return false;
}

async function recordLoginAttempt(
  fastify: FastifyInstance,
  studentId: string,
  sucesso: boolean,
  metodo: string,
  ip: string,
  userAgent: string,
  falhaMotivo?: string
) {
  await fastify.pg.query(
    `INSERT INTO student_login_history (student_id, metodo, ip_address, user_agent, sucesso, falha_motivo)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [studentId, metodo, ip, userAgent, sucesso, falhaMotivo || null]
  );

  if (sucesso) {
    await fastify.pg.query(
      `UPDATE students SET login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
      [studentId]
    );
  } else {
    await fastify.pg.query(
      `UPDATE students SET login_attempts = login_attempts + 1,
        locked_until = CASE
          WHEN login_attempts + 1 >= $2 THEN NOW() + INTERVAL '${LOCKOUT_DURATION_MINUTES} minutes'
          ELSE locked_until
        END
       WHERE id = $1`,
      [studentId, MAX_LOGIN_ATTEMPTS]
    );
  }
}

async function generateTokens(
  fastify: FastifyInstance,
  student: any
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const accessToken = fastify.jwt.sign(
    {
      sub: student.id,
      role: 'student',
      escola_id: student.escola_id,
      nome: student.nome,
    },
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = randomUUID() + '-' + randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const ip = 'unknown';
  const ua = 'unknown';

  await fastify.pg.query(
    `INSERT INTO student_sessions (student_id, refresh_token, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [student.id, refreshToken, ua, ip, expiresAt]
  );

  return { accessToken, refreshToken, expiresAt };
}

async function revokeSession(fastify: FastifyInstance, refreshToken: string) {
  await fastify.pg.query(
    `UPDATE student_sessions SET revoked_at = NOW() WHERE refresh_token = $1 AND revoked_at IS NULL`,
    [refreshToken]
  );
}

export async function studentAuthRoutes(fastify: FastifyInstance) {

  // ─── POST /api/auth/student/login ───
  fastify.post('/api/auth/student/login', async (request: any, reply) => {
    let parsed: { email: string; senha: string };
    try { parsed = validate(studentLoginEmailSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    const { email, senha } = parsed;
    const ip = request.ip || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    const res = await fastify.pg.query(
      `SELECT id, nome, email, senha_hash, escola_id, ativo, login_attempts, locked_until, email_verified_at, numero_estudante, telefone
       FROM students WHERE email = $1`,
      [email]
    );
    const student = res.rows[0];

    if (!student) {
      return reply.status(401).send({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });
    }

    if (!student.ativo) {
      return reply.status(403).send({ error: 'Conta desativada', code: 'ACCOUNT_DISABLED' });
    }

    if (await checkBruteForce(fastify, student.id)) {
      return reply.status(429).send({
        error: `Conta bloqueada temporariamente. Tente novamente em ${LOCKOUT_DURATION_MINUTES} minutos.`,
        code: 'ACCOUNT_LOCKED'
      });
    }

    const senhaValida = student.senha_hash && await bcrypt.compare(senha, student.senha_hash);
    if (!senhaValida) {
      await recordLoginAttempt(fastify, student.id, false, 'email_password', ip, userAgent, 'senha_invalida');
      return reply.status(401).send({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });
    }

    const tokens = await generateTokens(fastify, student);
    await recordLoginAttempt(fastify, student.id, true, 'email_password', ip, userAgent);

    return reply.send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
      student: {
        id: student.id,
        nome: student.nome,
        email: student.email,
        numero_estudante: student.numero_estudante,
        telefone: student.telefone,
        escola_id: student.escola_id,
      }
    });
  });

  // ─── POST /api/auth/student/refresh ───
  fastify.post('/api/auth/student/refresh', async (request: any, reply) => {
    let parsed: { refreshToken: string };
    try { parsed = validate(studentRefreshSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    const { refreshToken } = parsed;

    const res = await fastify.pg.query(
      `SELECT ss.*, s.nome, s.email, s.escola_id, s.ativo
       FROM student_sessions ss
       JOIN students s ON s.id = ss.student_id
       WHERE ss.refresh_token = $1`,
      [refreshToken]
    );
    const session = res.rows[0];

    if (!session) {
      return reply.status(401).send({ error: 'Refresh token inválido ou expirado', code: 'INVALID_REFRESH_TOKEN' });
    }

    if (!session.ativo) {
      await revokeSession(fastify, refreshToken);
      return reply.status(403).send({ error: 'Conta desativada', code: 'ACCOUNT_DISABLED' });
    }

    if (session.revoked_at) {
      await fastify.pg.query(
        `UPDATE student_sessions SET revoked_at = NOW() WHERE student_id = $1 AND revoked_at IS NULL`,
        [session.student_id]
      );
      return reply.status(401).send({ error: 'Refresh token reutilizado. Todas as sessões foram revogadas por segurança.', code: 'TOKEN_REUSE_DETECTED' });
    }

    if (session.expires_at <= new Date()) {
      return reply.status(401).send({ error: 'Refresh token expirado', code: 'EXPIRED_REFRESH_TOKEN' });
    }

    await revokeSession(fastify, refreshToken);

    const tokens = await generateTokens(fastify, {
      id: session.student_id,
      nome: session.nome,
      email: session.email,
      escola_id: session.escola_id,
    });

    return reply.send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
    });
  });

  // ─── POST /api/auth/student/logout ───
  fastify.post('/api/auth/student/logout', async (request: any, reply) => {
    const { refreshToken } = request.body || {};
    if (refreshToken) {
      await revokeSession(fastify, refreshToken);
    }
    return reply.send({ success: true });
  });

  // ─── POST /api/auth/student/logout/all ───
  fastify.post('/api/auth/student/logout/all', async (request: any, reply) => {
    const studentId = request.body?.studentId;
    if (!studentId) return reply.status(400).send({ error: 'studentId é obrigatório' });

    await fastify.pg.query(
      `UPDATE student_sessions SET revoked_at = NOW() WHERE student_id = $1 AND revoked_at IS NULL`,
      [studentId]
    );

    return reply.send({ success: true });
  });

  // ─── PUT /api/auth/student/password ───
  fastify.put('/api/auth/student/password', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido' });
    }

    let parsed: { senha_atual: string; nova_senha: string };
    try { parsed = validate(studentChangePasswordSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }

    const studentId = request.user.sub;
    const res = await fastify.pg.query(
      'SELECT senha_hash FROM students WHERE id = $1',
      [studentId]
    );
    const student = res.rows[0];
    if (!student) return reply.status(404).send({ error: 'Aluno não encontrado' });

    const valida = student.senha_hash && await bcrypt.compare(parsed.senha_atual, student.senha_hash);
    if (!valida) return reply.status(400).send({ error: 'Senha atual incorreta' });

    const novaHash = await bcrypt.hash(parsed.nova_senha, 10);
    await fastify.pg.query('UPDATE students SET senha_hash = $1 WHERE id = $2', [novaHash, studentId]);

    return reply.send({ success: true });
  });

  // ─── GET /api/auth/student/me ───
  fastify.get('/api/auth/student/me', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const res = await fastify.pg.query(
      `SELECT id, nome, email, numero_estudante, telefone, endereco, data_nascimento,
              documento_identificacao, categoria, estado_formacao, data_matricula,
              ativo, email_verified_at, last_login_at, created_at,
              (SELECT COUNT(*) FROM tickets WHERE student_id = students.id) as total_tickets,
              (SELECT COUNT(*) FROM tickets WHERE student_id = students.id AND status = 'finished') as tickets_concluidos,
              (SELECT COUNT(*) FROM training_records WHERE student_id = students.id AND status = 'concluida') as aulas_realizadas
       FROM students WHERE id = $1`,
      [studentId]
    );
    const student = res.rows[0];
    if (!student) return reply.status(404).send({ error: 'Aluno não encontrado' });

    return reply.send({ student });
  });

  // ─── GET /api/auth/student/history ───
  fastify.get('/api/auth/student/history', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const page = Math.max(1, parseInt(request.query?.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(request.query?.limit as string) || 20));
    const offset = (page - 1) * limit;

    const countRes = await fastify.pg.query(
      `SELECT COUNT(*) FROM student_login_history WHERE student_id = $1`,
      [studentId]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const res = await fastify.pg.query(
      `SELECT id, metodo, ip_address, user_agent, sucesso, falha_motivo, created_at
       FROM student_login_history
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    return reply.send({
      history: res.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  });

  // ─── GET /api/auth/student/sessions ───
  fastify.get('/api/auth/student/sessions', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const res = await fastify.pg.query(
      `SELECT id, user_agent, ip_address, expires_at, created_at
       FROM student_sessions
       WHERE student_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [studentId]
    );

    return reply.send({ sessions: res.rows });
  });

  // ─── GET /api/auth/student/exam-registrations ─── (student sees their exam registrations)
  fastify.get('/api/auth/student/exam-registrations', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const { ExamRegistrationModel } = await import('../../src/models/ExamRegistration.js');
    const rows = await ExamRegistrationModel.listarPorAluno(fastify.pg, studentId);
    return reply.send(rows);
  });

  // ─── GET /api/auth/student/lessons ─── (student sees their own lessons)
  fastify.get('/api/auth/student/lessons', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const { LessonModel } = await import('../../src/models/Lesson.js');
    const res = await fastify.pg.query(
      `SELECT tr.*,
              c.matricula as car_matricula,
              u.nome as instructor_nome
       FROM training_records tr
       LEFT JOIN cars c ON c.id = tr.car_id
       LEFT JOIN users u ON u.id = tr.instructor_id
       WHERE tr.student_id = $1
       ORDER BY tr.data DESC, tr.created_at DESC`,
      [studentId]
    );
    return reply.send(res.rows);
  });

  // ─── GET /api/auth/student/tickets ─── (student sees their own ticket history)
  fastify.get('/api/auth/student/tickets', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const client = await fastify.pg.connect();
    try {
      const { StudentModel } = await import('../../src/models/Student.js');
      const tickets = await StudentModel.tickets(client, studentId);
      return reply.send(tickets);
    } finally {
      client.release();
    }
  });

  // ─── GET /api/auth/student/notifications ───
  fastify.get('/api/auth/student/notifications', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const { NotificationModel } = await import('../../src/models/Notification.js');
    const notifications = await NotificationModel.listar(fastify.pg, studentId);
    const naoLidas = await NotificationModel.contarNaoLidas(fastify.pg, studentId);
    return reply.send({ notifications, naoLidas });
  });

  // ─── PUT /api/auth/student/notifications/:id/read ───
  fastify.put('/api/auth/student/notifications/:id/read', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const { id } = request.params as any;
    const { NotificationModel } = await import('../../src/models/Notification.js');
    const ok = await NotificationModel.marcarLida(fastify.pg, id, studentId);
    if (!ok) return reply.status(404).send({ error: 'Notificação não encontrada' });
    return reply.send({ success: true });
  });

  // ─── PUT /api/auth/student/notifications/read-all ───
  fastify.put('/api/auth/student/notifications/read-all', async (request: any, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'student') {
        return reply.status(403).send({ error: 'Acesso negado', code: 'FORBIDDEN' });
      }
    } catch {
      return reply.status(401).send({ error: 'Token inválido', code: 'UNAUTHORIZED' });
    }

    const studentId = request.user.sub;
    const { NotificationModel } = await import('../../src/models/Notification.js');
    await NotificationModel.marcarTodasLidas(fastify.pg, studentId);
    return reply.send({ success: true });
  });
}
