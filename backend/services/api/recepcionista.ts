import { FastifyInstance } from 'fastify';
import { TicketModel } from '../../src/models/Ticket.js';
import { notificarAluno, notificarFila } from '../../websocket/index.js';
import { formatTicket } from '../../src/shared/formatTicket.js';
import { authBackoffice } from '../../src/shared/auth.js';
import { registrarAuditoria } from '../../src/shared/auditoria.js';
import { validate, chamarTicketSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';

export async function recepcionistaRoutes(fastify: FastifyInstance) {

    // Obter fila TODA da escola (para backoffice) - ordenada por prioridade
    fastify.get('/api/fila/escola/:escolaId', async (request: any, reply) => {
        if (!(await authBackoffice(request, reply))) return;
        const { escolaId } = request.params as any;
        if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
        const client = await fastify.pg.connect();
        try {
            const result = await client.query(
                `SELECT 
                    t.id, 
                    t.codigo_senha as senha_gerada, 
                    t.aluno_token,
                    t.aluno_nome,
                    t.mesa_atendimento,
                    t.servico_id,
                    s.nome as servico_nome,
                    t.status as estado,
                    t.priority_level,
                    t.alertas,
                    t.created_at,
                    ROW_NUMBER() OVER (ORDER BY t.priority_level DESC NULLS LAST, t.created_at ASC) as posicao_fila
                FROM tickets t
                JOIN servicos s ON t.servico_id = s.id
                WHERE t.escola_id = $1 AND t.status IN ('waiting', 'called')
                ORDER BY t.priority_level DESC NULLS LAST, t.created_at ASC`,
                [escolaId]
            );
            // Calcular stats
            const statsRes = await client.query(
                `SELECT
                    (SELECT COUNT(*) FROM tickets WHERE escola_id = $1 AND status = 'finished' AND DATE(created_at) = CURRENT_DATE) as atendidos_hoje,
                    (SELECT COALESCE(AVG(s.tempo_medio_atendimento), 0) FROM tickets t JOIN servicos s ON t.servico_id = s.id WHERE t.escola_id = $1 AND t.status = 'waiting') as tempo_medio_espera`,
                [escolaId]
            );
            const stats = statsRes.rows[0];
            const atendidosHoje = parseInt(stats.atendidos_hoje, 10);
            const tempoMedioEspera = Math.round(parseFloat(stats.tempo_medio_espera));

            const tickets = result.rows.map(row => ({
                id: row.id,
                senha_gerada: row.senha_gerada,
                aluno_token: row.aluno_token,
                aluno_nome: row.aluno_nome,
                mesa_atendimento: row.mesa_atendimento,
                servico_id: row.servico_id,
                servico_nome: row.servico_nome,
                estado: row.estado,
                priority_level: row.priority_level || 0,
                alertas: row.alertas || [],
                created_at: row.created_at,
                posicao_fila: row.posicao_fila,
            }));
            return reply.send({ tickets, stats: { atendidosHoje, tempoMedioEspera } });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'DB error' });
        } finally { client.release(); }
    });

    // Chamar um ticket específico
    const chamarHandler = async (request: any, reply: any) => {
        if (!(await authBackoffice(request, reply))) return;
        const { ticketId } = request.params as any;
        let parsed: { mesa?: string };
        try { parsed = validate<{ mesa?: string }>(chamarTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
        const { mesa } = parsed;
        return withDb(fastify, async (client) => {
            const ticket = await TicketModel.chamarTicket(client, ticketId, mesa);
            if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const payload = formatTicket(ticket);
            notificarAluno(ticket.aluno_token, { evento: 'chamado', dados: payload });
            notificarFila(ticket.escola_id, 'ticket_chamado', payload);
            await registrarAuditoria(fastify, 'chamar_ticket', request.user?.id, request.user?.nome, ticketId, { mesa, metodo: 'recepcionista' });
            return reply.send({ ticket: payload });
        });
    };
    fastify.post('/api/recepcionista/chamar/:ticketId', chamarHandler);

    // Chamar próximo ticket na fila do serviço
    const chamarNextHandler = async (request: any, reply: any) => {
        if (!(await authBackoffice(request, reply))) return;
        const { servicoId } = request.params as any;
        let parsed: { mesa?: string };
        try { parsed = validate<{ mesa?: string }>(chamarTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
        const { mesa } = parsed;
        return withDb(fastify, async (client) => {
            const fila = await TicketModel.buscarFilaPorServico(client, servicoId);
            const proximo = fila.find((t: any) => t.status === 'waiting');
            if (!proximo) return reply.status(404).send({ error: 'Nenhum ticket waiting' });
            const ticket = await TicketModel.chamarTicket(client, proximo.id, mesa);
            if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const payload = formatTicket(ticket);
            notificarAluno(ticket.aluno_token, { evento: 'chamado', dados: payload });
            notificarFila(ticket.escola_id, 'ticket_chamado', payload);
            await registrarAuditoria(fastify, 'chamar_ticket', request.user?.id, request.user?.nome, ticket.id, { mesa, metodo: 'next' });
            return reply.send({ ticket: payload });
        });
    };
    fastify.post('/api/recepcionista/chamar/next/:servicoId', chamarNextHandler);

    // Finalizar atendimento
    const finalizarHandler = async (request: any, reply: any) => {
        if (!(await authBackoffice(request, reply))) return;
        const { ticketId } = request.params as any;
        return withDb(fastify, async (client) => {
            const ticket = await TicketModel.finalizarTicket(client, ticketId);
            if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const payload = { ...formatTicket(ticket), posicao_fila: ticket.posicao };
            notificarFila(ticket.escola_id, 'ticket_finalizado', payload);
            await registrarAuditoria(fastify, 'finalizar_ticket', request.user?.id, request.user?.nome, ticketId, { metodo: 'recepcionista' });
            return reply.send({ ticket: payload });
        });
    };
    fastify.post('/api/recepcionista/finalizar/:ticketId', finalizarHandler);
}