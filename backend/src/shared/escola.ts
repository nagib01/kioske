import { FastifyInstance } from 'fastify';

export async function getDefaultEscolaId(fastify: FastifyInstance) {
    const res = await fastify.pg.query('SELECT id FROM escolas ORDER BY created_at ASC LIMIT 1');
    return res.rows[0]?.id as string | undefined;
}

/**
 * Resolves the escola id for a request. Precedence: authenticated user's
 * escola_id, then (optionally) the `x-escola-id` header, request body
 * `escolaId`, query `escolaId`, and finally the default escola.
 */
export async function resolveEscolaId(
    fastify: FastifyInstance,
    request: any,
    sources: { header?: boolean; body?: boolean; query?: boolean } = {},
): Promise<string | undefined> {
    return (
        request.user?.escola_id ||
        (sources.header && request.headers?.['x-escola-id']) ||
        (sources.body && request.body?.escolaId) ||
        (sources.query && request.query?.escolaId) ||
        (await getDefaultEscolaId(fastify))
    );
}
