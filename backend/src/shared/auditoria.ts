import { FastifyInstance } from 'fastify';

export async function registrarAuditoria(
  fastify: FastifyInstance,
  acao: string,
  utilizadorId: string | number | null,
  utilizadorNome: string | null,
  escolaId: string | number | null,
  ticketId: string | number | null,
  detalhes: Record<string, unknown> | null
) {
  try {
    await fastify.pg.query(
      `INSERT INTO audit_log (acao, utilizador_id, utilizador_nome, escola_id, ticket_id, detalhes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [acao, utilizadorId, utilizadorNome, escolaId, ticketId, detalhes ? JSON.stringify(detalhes) : null]
    );
  } catch (err) {
    fastify.log.error({ msg: 'Erro ao registrar auditoria', err });
  }
}
