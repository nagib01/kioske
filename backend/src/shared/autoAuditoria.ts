import { FastifyInstance } from 'fastify';
import { registrarAuditoria } from './auditoria.js';
import { getDefaultEscolaId } from './escola.js';

const SENSITIVE_FIELDS = new Set(['senha', 'senha_hash', 'token', 'refresh_token', 'kioskToken']);

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(k)) continue;
    clean[k] = sanitize(v);
  }
  return clean;
}

function extractTicketId(params: Record<string, unknown>): string | number | null {
  if (params.ticketId) return params.ticketId as string;
  if (params.id && !params.servicoId && !params.question_id && !params.opcaoId && !params.lessonId) {
    return params.id as string;
  }
  return null;
}

export async function registerAuditHook(fastify: FastifyInstance) {
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return;

    const req = request as any;
    const routeUrl = req.routeOptions?.url || req.url;
    const acao = `${req.method}:${routeUrl}`;
    const user = req.user || {};

    const escolaId = user.escola_id || (await getDefaultEscolaId(fastify).catch(() => undefined));

    const params = (req.params || {}) as Record<string, unknown>;
    const body = req.body as Record<string, unknown> | undefined;
    const detalhes: Record<string, unknown> = {};

    if (Object.keys(params).length > 0) {
      detalhes.params = sanitize(params);
    }
    if (body && Object.keys(body).length > 0) {
      detalhes.body = sanitize(body);
    }

    await registrarAuditoria(
      fastify,
      acao,
      user.id || null,
      user.nome || null,
      escolaId || null,
      extractTicketId(params),
      detalhes
    );
  });
}
