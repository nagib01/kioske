import { FastifyInstance } from 'fastify';
import { TriagemEngine, PerguntaTriagem, RespostaTriagem } from '../../services/TriagemEngine.js';
import { TicketModel } from '../../src/models/Ticket.js';
import { notificarFila, notificarAluno } from '../../websocket/index.js';
import { formatTicket } from '../../src/shared/formatTicket.js';
import { gerarQRCode } from '../../src/shared/qrCode.js';
import { registrarAuditoria } from '../../src/shared/auditoria.js';
import { getDefaultEscolaId } from '../../src/shared/escola.js';
import { authBackoffice } from '../../src/shared/auth.js';
import { validate, chamarTicketSchema, servicoIdSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';
import type { PerguntaRow, OpcaoRow } from '../../src/shared/types.js';

const buscarPerguntas = async (fastify: FastifyInstance, escolaId: string, servicoId: string) => {
    const perguntasRes = await fastify.pg.query(
        `SELECT *
         FROM triage_questions
         WHERE escola_id = $1
           AND ativo = true
           AND (servico_id IS NULL OR servico_id = $2)
         ORDER BY ordem ASC, created_at ASC`,
        [escolaId, servicoId]
    );

    const perguntas = perguntasRes.rows as PerguntaRow[];
    if (!perguntas.length) return [];

    const opcoesRes = await fastify.pg.query(
        `SELECT *
         FROM triage_question_options
         WHERE question_id = ANY($1)
           AND ativo = true
         ORDER BY ordem ASC, created_at ASC`,
        [perguntas.map((p) => p.id)]
    );

    const opcoes = opcoesRes.rows as OpcaoRow[];
    const opcoesPorPergunta = new Map<string, OpcaoRow[]>();
    for (const opcao of opcoes) {
        const arr = opcoesPorPergunta.get(opcao.question_id) || [];
        arr.push(opcao);
        opcoesPorPergunta.set(opcao.question_id, arr);
    }

    return perguntas.map((p) => ({
        id: p.id,
        chave: p.chave,
        texto: p.texto,
        tipo: p.tipo,
        obrigatoria: p.obrigatoria,
        ordem: p.ordem,
        regras: Array.isArray(p.regras) ? p.regras : [],
        opcoes: (opcoesPorPergunta.get(p.id) || []).map((o) => ({
            id: o.id,
            label: o.label,
            value: o.value,
            ordem: o.ordem
        }))
    }));
};

export async function triagemRoutes(fastify: FastifyInstance) {
    fastify.get('/api/servicos', async (request: any, reply) => {
        const escolaIdFromQuery = (request.query?.escolaId as string | undefined) || undefined;
        const escolaId = escolaIdFromQuery || (await getDefaultEscolaId(fastify));
        if (!escolaId) return reply.send([]);

        const res = await fastify.pg.query(
            `SELECT id, nome, tempo_medio_atendimento, codigo_prefixo, ativo
             FROM servicos
             WHERE escola_id = $1 AND ativo = true
             ORDER BY created_at ASC`,
            [escolaId]
        );
        return reply.send(res.rows);
    });

    const perguntasTriagemHandler = async (request: any, reply: any) => {
        const servicoId = (request.params?.servicoId as string | undefined) || (request.query?.servicoId as string | undefined);
        const escolaIdFromQuery = request.query?.escolaId as string | undefined;
        const escolaId = escolaIdFromQuery || (await getDefaultEscolaId(fastify));

        if (!servicoId || !escolaId) {
            return reply.status(400).send({ error: 'servicoId e escolaId são obrigatórios' });
        }

        const perguntas = await buscarPerguntas(fastify, escolaId, servicoId);
        return reply.send({ perguntas });
    };

    fastify.get('/api/triagem/perguntas', perguntasTriagemHandler);
    fastify.get('/api/triagem/perguntas/:servicoId', perguntasTriagemHandler);

    const criarTicketHandler = async (request: any, reply: any) => {
        const body = request.body as any;
        const { servicoId, respostas, escolaId: escolaIdBody, alunoToken, studentId } = body;
        const escolaId = escolaIdBody || (await getDefaultEscolaId(fastify));

        if (!servicoId || !escolaId) {
            return reply.status(400).send({ error: 'servicoId e escolaId são obrigatórios' });
        }

        // If no studentId provided, try to get from JWT (authenticated student)
        let resolvedStudentId = studentId;
        if (!resolvedStudentId) {
            try {
                await request.jwtVerify();
                if (request.user?.role === 'student' && request.user?.sub) {
                    resolvedStudentId = request.user.sub;
                }
            } catch {}
        }

        const respostasArr: RespostaTriagem[] = Array.isArray(respostas) ? respostas : [];

        const servicoRes = await fastify.pg.query('SELECT nome FROM servicos WHERE id = $1 AND ativo = true', [servicoId]);
        if (!servicoRes.rows.length) {
            return reply.status(404).send({ error: 'Serviço não encontrado ou inativo' });
        }

        const perguntas = await buscarPerguntas(fastify, escolaId, servicoId);
        const perguntasEngine: PerguntaTriagem[] = perguntas.map((p: any) => ({
            id: p.id,
            texto: p.texto,
            regras: p.regras
        }));

        const resultado = TriagemEngine.processar(respostasArr, perguntasEngine);

        const client = await fastify.pg.connect();
        try {
            const ticket = await TicketModel.criar(client, escolaId, servicoId, {
                priority: resultado.priority,
                priority_level: resultado.priorityLevel,
                alertas: resultado.alertas,
                aluno_token: alunoToken,
                aluno_nome: undefined,
                student_id: resolvedStudentId,
            });

            const perguntasPorId = new Map<string, any>(perguntas.map((p: any) => [p.id, p]));
            await TicketModel.guardarRespostasTriagem(
                client,
                ticket.id,
                respostasArr.map((r) => {
                    const pergunta = perguntasPorId.get(r.perguntaId);
                    const opcao = pergunta?.opcoes?.find((o: any) => String(o.value) === String(r.resposta));
                    return {
                        perguntaId: r.perguntaId,
                        perguntaTexto: pergunta?.texto,
                        respostaValor: String(r.resposta),
                        respostaLabel: r.respostaLabel || opcao?.label || String(r.resposta)
                    };
                })
            );

            const ticketOut = formatTicket(ticket);
            const qrCode = await gerarQRCode(ticket.aluno_token);
            const out = { ...ticketOut, qrCode };

            try { notificarFila(escolaId, 'novo_ticket', out); } catch { fastify.log.debug('WS notify fila failed'); }
            try { notificarAluno(ticket.aluno_token, { event: 'estado_inicial', data: out }); } catch { fastify.log.debug('WS notify aluno failed'); }

            await registrarAuditoria(fastify, 'criar_ticket', null, null, ticket.id, {
                servicoId, metodo: 'triagem'
            });

            return reply.send({ ticket: out, alertas: resultado.alertas });
        } finally {
            client.release();
        }
    };

    fastify.post('/api/triagem/finalizar', criarTicketHandler);

    fastify.get('/api/tickets/:alunoToken', async (request: any, reply) => {
        const alunoToken = request.params?.alunoToken as string;
        if (!alunoToken) return reply.status(400).send({ error: 'alunoToken é obrigatório' });

        const client = await fastify.pg.connect();
        try {
            const ticket = await TicketModel.buscarPorAlunoToken(client, alunoToken);
            if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' });

            const payload = formatTicket(ticket);
            const tempoMedio = Number(ticket.tempo_medio_atendimento || 10);
            return reply.send({
                ...payload,
                tempo_estimado_min: Math.max((payload.posicao_fila - 1) * tempoMedio, 0)
            });
        } finally {
            client.release();
        }
    });

    // Retornar a fila atual (waiting + called) ordenada
    const filaPorServicoHandler = async (request: any, reply: any) => {
        const { servicoId } = request.params as any;
        if (!servicoId) return reply.status(400).send({ error: 'servicoId é necessário' });
        const client = await fastify.pg.connect();
        try {
            const fila = await TicketModel.buscarFilaPorServico(client, servicoId);
            return reply.send({ fila: fila.map(formatTicket) });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'DB error' });
        } finally {
            client.release();
        }
    };

    fastify.get('/api/fila/:servicoId', filaPorServicoHandler);

    fastify.get('/api/fila', async (request: any, reply) => {
        const servicoId = request.query?.servicoId as string | undefined;
        const escolaIdFromQuery = request.query?.escolaId as string | undefined;
        const escolaId = escolaIdFromQuery || (await getDefaultEscolaId(fastify));

        const client = await fastify.pg.connect();
        try {
            const fila = servicoId
                ? await TicketModel.buscarFilaPorServico(client, servicoId)
                : escolaId
                    ? await TicketModel.buscarFilaPorEscola(client, escolaId)
                    : [];

            return reply.send(fila.map(formatTicket));
        } finally {
            client.release();
        }
    });

    const chamarPorIdHandler = async (request: any, reply: any) => {
        if (!(await authBackoffice(request, reply))) return;
        const { ticketId } = request.params as any;
        let parsed: { mesa?: string };
        try { parsed = validate<{ mesa?: string }>(chamarTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
        const { mesa } = parsed;
        return withDb(fastify, async (client) => {
            const t = await TicketModel.chamarTicket(client, ticketId, mesa);
            if (!t) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const chamadoPayload = formatTicket(t);
            try { notificarAluno(t.aluno_token, { event: 'chamado', data: chamadoPayload }); } catch { fastify.log.debug('WS notify aluno failed'); }
            try { notificarFila(t.escola_id, 'ticket_chamado', chamadoPayload); } catch { fastify.log.debug('WS notify fila failed'); }
            await registrarAuditoria(fastify, 'chamar_ticket', request.user?.id, request.user?.nome, ticketId, { mesa });
            return reply.send({ ticket: chamadoPayload });
        });
    };

    fastify.post('/api/chamar/:ticketId', chamarPorIdHandler);

    fastify.post('/api/chamar/proximo', async (request: any, reply) => {
        if (!(await authBackoffice(request, reply))) return;
        let parsed: { mesa?: string; servicoId?: string; escolaId?: string };
        try { parsed = validate<{ mesa?: string; servicoId?: string; escolaId?: string }>(chamarTicketSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
        const { mesa } = parsed;
        const servicoId = request.body?.servicoId as string | undefined;
        const escolaIdBody = request.body?.escolaId as string | undefined;
        const escolaId = escolaIdBody || request.user?.escola_id || (await getDefaultEscolaId(fastify));
        return withDb(fastify, async (client) => {
            const fila = servicoId
                ? await TicketModel.buscarFilaPorServico(client, servicoId)
                : escolaId
                    ? await TicketModel.buscarFilaPorEscola(client, escolaId)
                    : [];
            const proximo = fila.find((t: any) => t.status === 'waiting');
            if (!proximo) return reply.status(404).send({ error: 'Nenhum ticket waiting' });
            const chamado = await TicketModel.chamarTicket(client, proximo.id, mesa);
            if (!chamado) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const payload = formatTicket(chamado);
            try { notificarAluno(chamado.aluno_token, { event: 'chamado', data: payload }); } catch { fastify.log.debug('WS notify aluno failed'); }
            try { notificarFila(chamado.escola_id, 'ticket_chamado', payload); } catch { fastify.log.debug('WS notify fila failed'); }
            await registrarAuditoria(fastify, 'chamar_ticket', request.user?.id, request.user?.nome, chamado.id, { mesa, metodo: 'proximo' });
            return reply.send({ ticket: payload });
        });
    });

    // Finalizar atendimento
    const finalizarHandler = async (request: any, reply: any) => {
        if (!(await authBackoffice(request, reply))) return;
        const { ticketId } = request.params as any;
        return withDb(fastify, async (client) => {
            const ticket = await TicketModel.finalizarTicket(client, ticketId);
            if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' });
            const out = formatTicket(ticket);
            try { notificarFila(ticket.escola_id, 'ticket_finalizado', out); } catch { fastify.log.debug('WS notify failed'); }
            await registrarAuditoria(fastify, 'finalizar_ticket', request.user?.id, request.user?.nome, ticketId, {});
            return reply.send({ ticket: out });
        });
    };

    fastify.post('/api/finalizar/:ticketId', finalizarHandler);
}