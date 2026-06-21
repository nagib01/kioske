import { FastifyInstance } from 'fastify';
import { TicketModel } from '../../src/models/Ticket.js';
import { formatTicket } from '../../src/shared/formatTicket.js';
import { gerarQRCode } from '../../src/shared/qrCode.js';
import { registrarAuditoria } from '../../src/shared/auditoria.js';
import { authBackoffice } from '../../src/shared/auth.js';
import { getDefaultEscolaId } from '../../src/shared/escola.js';
import { notificarFila, notificarAluno, safeNotify } from '../../websocket/index.js';
import { ERR } from '../../src/shared/errors.js';
import { validate, validateBody, criarTicketManualSchema, transferirTicketSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';

export async function kioskRoutes(fastify: FastifyInstance) {

  // GET /api/tickets/:id/reprint - Reimprimir senha com QR Code
  fastify.get('/api/tickets/:id/reprint', async (request: any, reply: any) => {
    const { id } = request.params as any;
    if (!id) return reply.status(400).send(ERR.MISSING_FIELD('id'));

    const client = await fastify.pg.connect();
    try {
      const ticket = await TicketModel.buscarPorId(client, id);
      if (!ticket) return reply.status(404).send(ERR.NOT_FOUND('Ticket'));

      const formatted = formatTicket(ticket);
      const qrCode = await gerarQRCode(ticket.aluno_token);
      return reply.send({ ticket: { ...formatted, qrCode } });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send(ERR.DB_ERROR);
    } finally {
      client.release();
    }
  });

  // POST /api/admin/tickets - Criar senha manualmente pelo backoffice
  fastify.post('/api/admin/tickets', async (request: any, reply: any) => {
    if (!(await authBackoffice(request, reply))) return;
    const parsed = validateBody(criarTicketManualSchema, request.body, reply); if (parsed === undefined) return;
    const { servicoId, alunoNome } = parsed;
    const escolaId = request.body?.escolaId || request.user?.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send(ERR.MISSING_FIELD('escolaId'));

    const studentId = request.body?.studentId as string | undefined;

    return withDb(fastify, async (client) => {
      const ticket = await TicketModel.criar(client, escolaId, servicoId, {
        aluno_token: undefined,
        priority: false,
        priority_level: 0,
        alertas: [],
        aluno_nome: alunoNome || undefined,
        student_id: studentId || undefined,
      });

      const formatted = formatTicket(ticket);
      const qrCode = await gerarQRCode(ticket.aluno_token);

      const out = { ...formatted, qrCode };
      safeNotify('WS notify failed', () => notificarFila(escolaId, 'novo_ticket', out));
      safeNotify('WS notify failed', () => notificarAluno(ticket.aluno_token, { event: 'estado_inicial', data: out }));

      await registrarAuditoria(fastify, 'criar_ticket', request.user?.id, request.user?.nome, ticket.id, {
        servicoId, alunoNome, metodo: 'manual'
      });

      return reply.status(201).send({ ticket: out });
    });
  });

  // POST /api/tickets/:id/transferir - Transferir senha entre mesas
  fastify.post('/api/tickets/:id/transferir', async (request: any, reply: any) => {
    if (!(await authBackoffice(request, reply))) return;
    const { id } = request.params as any;
    let parsed: { mesa: string };
    try { parsed = validate<{ mesa: string }>(transferirTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    const { mesa } = parsed;

    return withDb(fastify, async (client) => {
      const ticket = await TicketModel.buscarPorId(client, id);
      if (!ticket) return reply.status(404).send(ERR.NOT_FOUND('Ticket'));
      if (ticket.status !== 'called') return reply.status(400).send({
        error: 'Apenas tickets em atendimento podem ser transferidos',
        code: 'INVALID_STATUS'
      });

      const updated = await TicketModel.transferirTicket(client, id, mesa);
      if (!updated) return reply.status(404).send(ERR.NOT_FOUND('Ticket'));
      const formatted = formatTicket(updated);

      safeNotify('WS notify failed', () => notificarFila(updated.escola_id, 'ticket_chamado', formatted));

      await registrarAuditoria(fastify, 'transferir_ticket', request.user?.id, request.user?.nome, id, {
        mesa_origem: ticket.mesa_atendimento,
        mesa_destino: mesa
      });

      return reply.send({ ticket: formatted });
    });
  });

  // GET /api/admin/fila/complete - Fila completa com todos os estados
  fastify.get('/api/admin/fila/complete', async (request: any, reply: any) => {
    if (!(await authBackoffice(request, reply))) return;

    const escolaId = request.query?.escolaId || request.user?.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send(ERR.MISSING_FIELD('escolaId'));

    const servicoId = request.query?.servicoId as string | undefined;
    const status = request.query?.status as string | undefined;
    const page = Math.max(1, parseInt(request.query?.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(request.query?.limit as string) || 50));
    const offset = (page - 1) * limit;

    const client = await fastify.pg.connect();
    try {
      let where = 'WHERE t.escola_id = $1';
      const params: unknown[] = [escolaId];
      let paramIdx = 2;

      if (servicoId) {
        where += ` AND t.servico_id = $${paramIdx++}`;
        params.push(servicoId);
      }
      if (status) {
        where += ` AND t.status = $${paramIdx++}`;
        params.push(status);
      }

      const countRes = await client.query(
        `SELECT COUNT(*) FROM tickets t ${where}`, params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      const res = await client.query(
        `SELECT t.*, s.nome as servico_nome
         FROM tickets t
         JOIN servicos s ON s.id = t.servico_id
         ${where}
         ORDER BY t.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      );

      return reply.send({
        tickets: res.rows.map((row: any) => ({
          id: row.id,
          codigo_senha: row.codigo_senha,
          servico_nome: row.servico_nome,
          servico_id: row.servico_id,
          aluno_nome: row.aluno_nome,
          estado: row.status,
          priority_level: row.priority_level || 0,
          alertas: row.alertas || [],
          mesa_atendimento: row.mesa_atendimento,
          created_at: row.created_at,
          updated_at: row.updated_at,
          posicao_fila: row.posicao,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send(ERR.DB_ERROR);
    } finally {
      client.release();
    }
  });
}
