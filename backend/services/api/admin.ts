import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authAdmin } from '../../src/shared/auth.js';
import { resolveEscolaId } from '../../src/shared/escola.js';
import { registrarAuditoria } from '../../src/shared/auditoria.js';
import { validateBody, criarServicoSchema, criarPerguntaSchema, criarOpcaoSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';

const atualizarServicoSchema = z.object({
  nome: z.string().min(1).optional(),
  prioridade_base: z.number().optional(),
  ativo: z.boolean().optional(),
  codigo_prefixo: z.string().optional(),
  tempo_medio_atendimento: z.number().optional(),
  mesa_padrao: z.string().optional(),
  mesas: z.array(z.string()).optional(),
});

const atualizarOpcaoSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  ordem: z.number().optional(),
  regra: z.any().optional(),
  ativo: z.boolean().optional(),
});

const avaliarTriagemSchema = z.object({
  pergunta_resposta_pairs: z.array(z.object({
    opcao_id: z.string().min(1),
  })).min(1, 'pergunta_resposta_pairs deve conter pelo menos um par'),
});

export async function adminRoutes(fastify: FastifyInstance) {

    // Listar serviços da escola do admin
    fastify.get('/admin/servicos', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const escolaId = await resolveEscolaId(fastify, request, { query: true });
        if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
        return withDb(fastify, async (client) => {
            const res = await client.query('SELECT * FROM servicos WHERE escola_id = $1 ORDER BY created_at', [escolaId]);
            return reply.send({ servicos: res.rows });
        });
    });

    // Criar novo serviço
    fastify.post('/admin/servicos', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const parsed = validateBody(criarServicoSchema, request.body, reply); if (parsed === undefined) return;
        const { nome, prioridade_base, codigo_prefixo, tempo_medio_atendimento, mesa_padrao } = parsed;
        const escolaId = await resolveEscolaId(fastify, request, { body: true });
        if (!escolaId) return reply.status(400).send({ error: 'escolaId é obrigatório' });
        return withDb(fastify, async (client) => {
            const res = await client.query(
                `INSERT INTO servicos (escola_id, nome, prioridade_base, codigo_prefixo, tempo_medio_atendimento, mesa_padrao, ativo)
                 VALUES ($1,$2,COALESCE($3,0), COALESCE($4,'A'), COALESCE($5,10), COALESCE($6,'01'), true)
                 RETURNING *`,
                [escolaId, nome, prioridade_base, codigo_prefixo, tempo_medio_atendimento, mesa_padrao]
            );
            await registrarAuditoria(fastify, 'criar_servico', request.user?.id, request.user?.nome, null, { servicoId: res.rows[0].id, nome });
            return reply.send({ servico: res.rows[0] });
        });
    });

    // Editar serviço
    fastify.put('/admin/servicos/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        if (!id) return reply.status(400).send({ error: 'id é necessário' });
        const parsed = validateBody(atualizarServicoSchema, request.body, reply); if (parsed === undefined) return;
        const { nome, prioridade_base, ativo, codigo_prefixo, tempo_medio_atendimento, mesa_padrao, mesas } = parsed;
        return withDb(fastify, async (client) => {
            const res = await client.query(
                `UPDATE servicos
                 SET nome = COALESCE($2,nome),
                     prioridade_base = COALESCE($3,prioridade_base),
                     ativo = COALESCE($4,ativo),
                     codigo_prefixo = COALESCE($5,codigo_prefixo),
                     tempo_medio_atendimento = COALESCE($6,tempo_medio_atendimento),
                     mesa_padrao = COALESCE($7,mesa_padrao),
                     mesas = COALESCE($8::text[], mesas)
                 WHERE id = $1
                 RETURNING *`,
                [id, nome, prioridade_base, ativo, codigo_prefixo, tempo_medio_atendimento, mesa_padrao, mesas || null]
            );
            await registrarAuditoria(fastify, 'editar_servico', request.user?.id, request.user?.nome, null, { servicoId: id });
            return reply.send({ servico: res.rows[0] });
        });
    });

    // Soft delete (desativar)
    fastify.delete('/admin/servicos/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        if (!id) return reply.status(400).send({ error: 'id é necessário' });
        return withDb(fastify, async (client) => {
            const res = await client.query(`UPDATE servicos SET ativo = false WHERE id = $1 RETURNING *`, [id]);
            await registrarAuditoria(fastify, 'desativar_servico', request.user?.id, request.user?.nome, null, { servicoId: id });
            return reply.send({ servico: res.rows[0] });
        });
    });

    fastify.get('/admin/perguntas-triagem', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const escolaId = await resolveEscolaId(fastify, request, { query: true });
        if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
        const servicoId = request.query?.servicoId as string | undefined;
        return withDb(fastify, async (client) => {
            const perguntasRes = await client.query(
                `SELECT *
                 FROM triage_questions
                 WHERE escola_id = $1
                   AND ($2::bigint IS NULL OR servico_id = $2 OR servico_id IS NULL)
                 ORDER BY ordem ASC, created_at ASC`,
                [escolaId, servicoId || null]
            );
            const perguntas = perguntasRes.rows;

            const questionIds = perguntas.map((p: any) => p.id);
            const optionsRes = questionIds.length
                ? await client.query(
                    `SELECT * FROM triage_question_options
                     WHERE question_id = ANY($1)
                     ORDER BY ordem ASC, created_at ASC`,
                    [questionIds]
                )
                : { rows: [] as any[] };

            const optionsByQuestion = new Map<string, any[]>();
            for (const option of optionsRes.rows) {
                const list = optionsByQuestion.get(option.question_id) || [];
                list.push(option);
                optionsByQuestion.set(option.question_id, list);
            }

            return reply.send({
                perguntas: perguntas.map((p: any) => ({
                    ...p,
                    opcoes: optionsByQuestion.get(p.id) || []
                }))
            });
        });
    });

    fastify.post('/admin/perguntas-triagem', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const escolaId = await resolveEscolaId(fastify, request, { body: true });
        if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
        const parsed = validateBody(criarPerguntaSchema, request.body, reply); if (parsed === undefined) return;
        const { servico_id, texto, tipo, obrigatoria, ordem, opcoes } = parsed;
        const body = request.body as any;
        const chave = body.chave;
        const regras = body.regras;
        if (!texto) return reply.status(400).send({ error: 'texto é obrigatório' });

        return withDb(fastify, async (client) => {
            await client.query('BEGIN');
            const perguntaRes = await client.query(
                `INSERT INTO triage_questions (escola_id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo)
                 VALUES ($1, $2, $3, $4, COALESCE($5, 'single_choice'), COALESCE($6, true), COALESCE($7, 0), COALESCE($8, '[]'::jsonb), true)
                 RETURNING *`,
                [escolaId, servico_id || null, chave || null, texto, tipo, obrigatoria, ordem, JSON.stringify(regras || [])]
            );
            const pergunta = perguntaRes.rows[0];

            if (Array.isArray(opcoes) && opcoes.length > 0) {
                for (const [idx, opcao] of opcoes.entries()) {
                    await client.query(
                        `INSERT INTO triage_question_options (question_id, label, value, ordem, ativo)
                         VALUES ($1, $2, $3, COALESCE($4, $5), true)`,
                        [pergunta.id, opcao.label, opcao.value, opcao.ordem, idx]
                    );
                }
            }

            await client.query('COMMIT');
            return reply.send({ pergunta });
        });
    });

    fastify.put('/admin/perguntas-triagem/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        const { servico_id, chave, texto, tipo, obrigatoria, ordem, regras, ativo, opcoes } = request.body as any;
        if (!id) return reply.status(400).send({ error: 'id é obrigatório' });
        return withDb(fastify, async (client) => {
            await client.query('BEGIN');
            const perguntaRes = await client.query(
                `UPDATE triage_questions
                 SET servico_id = COALESCE($2, servico_id),
                     chave = COALESCE($3, chave),
                     texto = COALESCE($4, texto),
                     tipo = COALESCE($5, tipo),
                     obrigatoria = COALESCE($6, obrigatoria),
                     ordem = COALESCE($7, ordem),
                     regras = COALESCE($8, regras),
                     ativo = COALESCE($9, ativo),
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [id, servico_id, chave, texto, tipo, obrigatoria, ordem, regras ? JSON.stringify(regras) : null, ativo]
            );

            if (!perguntaRes.rows.length) {
                await client.query('ROLLBACK');
                return reply.status(404).send({ error: 'Pergunta não encontrada' });
            }

            if (Array.isArray(opcoes)) {
                await client.query('DELETE FROM triage_question_options WHERE question_id = $1', [id]);
                for (const [idx, opcao] of opcoes.entries()) {
                    await client.query(
                        `INSERT INTO triage_question_options (question_id, label, value, ordem, ativo)
                         VALUES ($1, $2, $3, COALESCE($4, $5), COALESCE($6, true))`,
                        [id, opcao.label, opcao.value, opcao.ordem, idx, opcao.ativo]
                    );
                }
            }

            await client.query('COMMIT');
            return reply.send({ pergunta: perguntaRes.rows[0] });
        });
    });

    fastify.delete('/admin/perguntas-triagem/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        if (!id) return reply.status(400).send({ error: 'id é obrigatório' });
        return withDb(fastify, async (client) => {
            const res = await client.query(
                `UPDATE triage_questions SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
                [id]
            );
            if (!res.rows.length) return reply.status(404).send({ error: 'Pergunta não encontrada' });
            return reply.send({ pergunta: res.rows[0] });
        });
    });

    // ==================== OPÇÕES DE TRIAGEM ====================

    fastify.post('/admin/opcoes', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const parsed = validateBody(criarOpcaoSchema, request.body, reply); if (parsed === undefined) return;
        const { question_id, label, value, ordem, regra } = parsed;
        return withDb(fastify, async (client) => {
            const result = await client.query(
                `INSERT INTO triage_question_options (question_id, label, value, ordem, regra, ativo)
                 VALUES ($1, $2, $3, $4, $5, true)
                 RETURNING *`,
                [question_id, label, value, ordem || 0, JSON.stringify(regra || {})]
            );
            return reply.send({ opcao: result.rows[0] });
        });
    });

    fastify.put('/admin/opcoes/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        const parsed = validateBody(atualizarOpcaoSchema, request.body, reply); if (parsed === undefined) return;
        const { label, value, ordem, regra, ativo } = parsed;
        return withDb(fastify, async (client) => {
            const result = await client.query(
                `UPDATE triage_question_options
                 SET label = COALESCE($2, label),
                     value = COALESCE($3, value),
                     ordem = COALESCE($4, ordem),
                     regra = COALESCE($5::jsonb, regra),
                     ativo = COALESCE($6, ativo),
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [id, label, value, ordem, regra ? JSON.stringify(regra) : null, ativo]
            );
            if (!result.rows.length) {
                return reply.status(404).send({ error: 'Opção não encontrada' });
            }
            return reply.send({ opcao: result.rows[0] });
        });
    });

    fastify.delete('/admin/opcoes/:id', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const { id } = request.params as any;
        return withDb(fastify, async (client) => {
            const result = await client.query(
                `UPDATE triage_question_options SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
                [id]
            );
            if (!result.rows.length) {
                return reply.status(404).send({ error: 'Opção não encontrada' });
            }
            return reply.send({ opcao: result.rows[0] });
        });
    });

    // ==================== AVALIAR TRIAGEM ====================

    fastify.post('/admin/triage/avaliar', async (request: any, reply) => {
        if (!(await authAdmin(request, reply))) return;
        const parsed = validateBody(avaliarTriagemSchema, request.body, reply); if (parsed === undefined) return;
        const { pergunta_resposta_pairs } = parsed;
        return withDb(fastify, async (client) => {
            let priority_level = 0;
            const alertas = new Set<string>();
            for (const pair of pergunta_resposta_pairs) {
                const { opcao_id } = pair;
                if (!opcao_id) continue;
                const resultOpcao = await client.query(
                    `SELECT regra FROM triage_question_options WHERE id = $1`,
                    [opcao_id]
                );
                if (!resultOpcao.rows.length) continue;
                const regra = resultOpcao.rows[0].regra || {};
                if (regra.priority_level) {
                    priority_level = Math.max(priority_level, regra.priority_level);
                }
                if (regra.alerta) {
                    alertas.add(regra.alerta);
                }
            }
            return reply.send({ priority_level, alertas: Array.from(alertas) });
        });
    });
}
// end adminRoutes