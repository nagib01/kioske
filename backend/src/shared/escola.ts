import { FastifyInstance } from 'fastify';

export async function getDefaultEscolaId(fastify: FastifyInstance) {
    const res = await fastify.pg.query('SELECT id FROM escolas ORDER BY created_at ASC LIMIT 1');
    return res.rows[0]?.id as string | undefined;
}
