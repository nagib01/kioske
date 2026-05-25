import { FastifyInstance } from 'fastify';
import { authAdmin } from '../../src/shared/auth.js';
import { validate, criarPerguntaSchema, criarOpcaoSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';

export async function adminTriageRoutes(fastify: FastifyInstance) {

  // ==================== PERGUNTAS ====================

  // GET /admin/triage/perguntas?servicoId=... - listar perguntas de um serviço
  fastify.get('/admin/triage/perguntas', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { servicoId } = request.query as any;
    return withDb(fastify, async (client) => {
      // Buscar perguntas
      const resultPerguntas = await client.query(
        `SELECT id, servico_id, texto, tipo, obrigatoria, ordem, regras, ativo, created_at, updated_at
         FROM triage_questions
         WHERE servico_id = $1 OR servico_id IS NULL
         ORDER BY ordem ASC`,
        [servicoId]
      );

      // Para cada pergunta, buscar suas opções
      const perguntas = await Promise.all(
        resultPerguntas.rows.map(async (p: any) => {
          const resultOpcoes = await client.query(
            `SELECT id, label, value, ordem, regra, ativo
             FROM triage_question_options
             WHERE question_id = $1
             ORDER BY ordem ASC`,
            [p.id]
          );
          return {
            ...p,
            opcoes: resultOpcoes.rows,
          };
        })
      );

      return reply.send({ perguntas });
    });
  });

  // POST /admin/triage/perguntas - criar pergunta
  fastify.post('/admin/triage/perguntas', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { servico_id, texto, tipo, obrigatoria, ordem, escola_id } = request.body as any;

    if (!texto || !tipo) {
      return reply.status(400).send({ error: 'texto e tipo são obrigatórios' });
    }

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `INSERT INTO triage_questions (escola_id, servico_id, texto, tipo, obrigatoria, ordem, regras, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb, true)
         RETURNING id, servico_id, texto, tipo, obrigatoria, ordem, regras, ativo, created_at`,
        [escola_id || 1, servico_id, texto, tipo, obrigatoria !== false, ordem || 0]
      );
      return reply.status(201).send(result.rows[0]);
    });
  });

  // PUT /admin/triage/perguntas/:id - editar pergunta
  fastify.put('/admin/triage/perguntas/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    const { texto, tipo, obrigatoria, ordem, ativo } = request.body as any;

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `UPDATE triage_questions
         SET texto = COALESCE($2, texto),
             tipo = COALESCE($3, tipo),
             obrigatoria = COALESCE($4, obrigatoria),
             ordem = COALESCE($5, ordem),
             ativo = COALESCE($6, ativo),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, servico_id, texto, tipo, obrigatoria, ordem, ativo, updated_at`,
        [id, texto, tipo, obrigatoria, ordem, ativo]
      );
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Pergunta não encontrada' });
      }
      return reply.send(result.rows[0]);
    });
  });

  // DELETE /admin/triage/perguntas/:id - deletar pergunta
  fastify.delete('/admin/triage/perguntas/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `DELETE FROM triage_questions WHERE id = $1 RETURNING id`,
        [id]
      );
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Pergunta não encontrada' });
      }
      return reply.send({ success: true, deleted_id: id });
    });
  });

  // ==================== OPÇÕES ====================

  // POST /admin/triage/opcoes - criar opção
  fastify.post('/admin/triage/opcoes', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { question_id, label, value, ordem, regra } = request.body as any;

    if (!question_id || !label || !value) {
      return reply.status(400).send({ error: 'question_id, label e value são obrigatórios' });
    }

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `INSERT INTO triage_question_options (question_id, label, value, ordem, regra, ativo)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id, label, value, ordem, regra, ativo, created_at`,
        [question_id, label, value, ordem || 0, JSON.stringify(regra || {})]
      );
      return reply.status(201).send(result.rows[0]);
    });
  });

  // PUT /admin/triage/opcoes/:id - editar opção
  fastify.put('/admin/triage/opcoes/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    const { label, value, ordem, regra, ativo } = request.body as any;

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `UPDATE triage_question_options
         SET label = COALESCE($2, label),
             value = COALESCE($3, value),
             ordem = COALESCE($4, ordem),
             regra = COALESCE($5::jsonb, regra),
             ativo = COALESCE($6, ativo)
         WHERE id = $1
         RETURNING id, label, value, ordem, regra, ativo`,
        [id, label, value, ordem, regra ? JSON.stringify(regra) : null, ativo]
      );
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Opção não encontrada' });
      }
      return reply.send(result.rows[0]);
    });
  });

  // DELETE /admin/triage/opcoes/:id - deletar opção
  fastify.delete('/admin/triage/opcoes/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;

    return withDb(fastify, async (client) => {
      const result = await client.query(
        `DELETE FROM triage_question_options WHERE id = $1 RETURNING id`,
        [id]
      );
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Opção não encontrada' });
      }
      return reply.send({ success: true, deleted_id: id });
    });
  });

  // ==================== AVALIAR TRIAGEM ====================

  // POST /admin/triage/avaliar - avaliar respostas e calcular priority_level + alertas
  fastify.post('/admin/triage/avaliar', async (request: any, reply) => {
    const { pergunta_resposta_pairs } = request.body as any;
    // Formato: [{ pergunta_id, opcao_id ou resposta_texto }, ...]

    if (!pergunta_resposta_pairs || !Array.isArray(pergunta_resposta_pairs)) {
      return reply.status(400).send({ error: 'pergunta_resposta_pairs deve ser um array' });
    }

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
        if (resultOpcao.rowCount === 0) continue;

        const regra = resultOpcao.rows[0].regra || {};
        if (regra.priority_level) {
          priority_level = Math.max(priority_level, regra.priority_level);
        }
        if (regra.alerta) {
          alertas.add(regra.alerta);
        }
      }

      return reply.send({
        priority_level,
        alertas: Array.from(alertas),
      });
    });
  });
}
