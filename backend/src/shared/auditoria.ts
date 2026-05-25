import { FastifyInstance } from 'fastify';

export type AcaoAudit =
  | 'login'
  | 'criar_ticket'
  | 'chamar_ticket'
  | 'transferir_ticket'
  | 'finalizar_ticket'
  | 'criar_servico'
  | 'editar_servico'
  | 'desativar_servico'
  | 'criar_pergunta'
  | 'editar_pergunta'
  | 'desativar_pergunta'
  | 'criar_aluno'
  | 'atualizar_aluno'
  | 'excluir_aluno';

export async function registrarAuditoria(
  fastify: FastifyInstance,
  acao: AcaoAudit,
  utilizadorId: string | number | null,
  utilizadorNome: string | null,
  ticketId: string | number | null,
  detalhes: Record<string, unknown> | null
) {
  try {
    await fastify.pg.query(
      `INSERT INTO audit_log (acao, utilizador_id, utilizador_nome, ticket_id, detalhes)
       VALUES ($1, $2, $3, $4, $5)`,
      [acao, utilizadorId, utilizadorNome, ticketId, detalhes ? JSON.stringify(detalhes) : null]
    );
  } catch (err) {
    fastify.log.error({ msg: 'Erro ao registrar auditoria', err });
  }
}
