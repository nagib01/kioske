import Fastify from 'fastify';
import postgres from '@fastify/postgres';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';
import rateLimit from '@fastify/rate-limit';
import { logger } from './shared/logger.js';

if (!process.env.NODE_ENV) {
    logger.error('NODE_ENV is missing from the environment configuration');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is missing from the environment configuration');
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL is missing from the environment configuration');
    process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL!;
logger.info(`Database: ${databaseUrl.replace(/\/\/.*:.*@/, '//***:***@')}`);

const corsOrigins = process.env.CORS_ORIGIN === '*'
    ? '*' as const
    : (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);

logger.info(`CORS origins: ${JSON.stringify(corsOrigins)}`);

const fastify = Fastify({
    logger: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

await fastify.register(cors, { origin: corsOrigins });
await fastify.register(postgres, { connectionString: databaseUrl });
await fastify.register(jwt, { secret: process.env.JWT_SECRET! });
await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });

fastify.get('/health', async (_request, reply) => {
    try {
        await fastify.pg.query('SELECT 1');
        return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    } catch {
        return reply.status(503).send({ status: 'error', message: 'database unreachable' });
    }
});

await registerRoutes(fastify);

const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
        logger.info(`Backend rodando em ${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
