import Fastify from 'fastify';
import postgres from '@fastify/postgres';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';
import rateLimit from '@fastify/rate-limit';
import { logger } from './shared/logger.js';
import { config, corsOrigins, validateConfig } from './config.js';
import { AppError } from './shared/errors.js';
import { registerAuditHook } from './shared/autoAuditoria.js';

logger.info('─── Backend starting ───');
logger.info(`NODE_ENV=${config.nodeEnv}`);
logger.info(`CORS_ORIGIN=${config.corsOrigin}`);
logger.info(`BACKEND_PORT=${config.backendPort}`);
logger.info(`FRONTEND_URL=${config.frontendUrl}`);

const missing = validateConfig();
if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

logger.info(`Database: ${config.databaseUrl.replace(/\/\/.*:.*@/, '//***:***@')}`);

const fastify = Fastify({
    logger: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

await fastify.register(cors, { origin: corsOrigins() });
await fastify.register(postgres, { connectionString: config.databaseUrl });
await fastify.register(jwt, { secret: config.jwtSecret });
await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });

// Centralized error handling: AppError -> its status/code; validation -> 400;
// anything else -> preserve a client status or fall back to a generic 500.
fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message, code: error.code, details: error.details });
    }
    if ((error as any).validation) {
        return reply.status(400).send({ error: error.message, code: 'VALIDATION_ERROR' });
    }
    const status = (error as any).statusCode && (error as any).statusCode >= 400 ? (error as any).statusCode : 500;
    if (status >= 500) request.log.error(error);
    return reply.status(status).send({
        error: status >= 500 ? 'Erro interno do servidor' : error.message,
        code: status >= 500 ? 'INTERNAL_ERROR' : undefined,
    });
});

fastify.get('/health', async (_request, reply) => {
    try {
        await fastify.pg.query('SELECT 1');
        return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    } catch {
        return reply.status(503).send({ status: 'error', message: 'database unreachable' });
    }
});

// Regista as rotas apenas uma vez
await registerRoutes(fastify);
await registerAuditHook(fastify);
fastify.get('/status', async (_request, reply) => {
    try {
        await fastify.pg.query('SELECT 1');
        return reply.status(200).send({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Connected',
        });
    } catch {
        return reply.status(500).send({
            status: 'Error',
            database: 'Disconnected',
            message: 'A base de dados não está a responder.',
        });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: config.backendPort, host: config.host });
        logger.info(`Backend rodando em ${config.host}:${config.backendPort}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();