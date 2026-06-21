import Fastify from 'fastify';
import postgres from '@fastify/postgres';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';
import rateLimit from '@fastify/rate-limit';
import { logger } from './shared/logger.js';
import { runMigrations } from './db/migrate.js';

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

function buildDatabaseUrl(): string {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const db = process.env.DB_NAME || user;
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

function parseCorsOrigins(): string | string[] {
    const raw = process.env.CORS_ORIGIN || '*';
    if (raw === '*') return '*';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

const databaseUrl = buildDatabaseUrl();
logger.info(`Database: ${databaseUrl.replace(/\/\/.*:.*@/, '//***:***@')}`);

const fastify = Fastify({
    logger: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

const corsOrigins = parseCorsOrigins();
logger.info(`CORS origins: ${JSON.stringify(corsOrigins)}`);

await fastify.register(cors, { origin: corsOrigins });
await fastify.register(postgres, { connectionString: databaseUrl });
await fastify.register(jwt, { secret: process.env.JWT_SECRET! });
await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });

const ensureDatabaseSchema = async () => {
    const statements = [
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS codigo_prefixo VARCHAR(5) NOT NULL DEFAULT 'A'`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS proximo_numero INT NOT NULL DEFAULT 1`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS tempo_medio_atendimento INT NOT NULL DEFAULT 10`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS prioridade_base INT DEFAULT 0`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS mesa_padrao VARCHAR(10) NOT NULL DEFAULT '01'`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`
    ];

    for (const statement of statements) {
        await fastify.pg.query(statement);
    }
};

await ensureDatabaseSchema();
await runMigrations(fastify);

// Regista as rotas apenas uma vez
await registerRoutes(fastify);

// verificar bd
fastify.get('/status', async (request, reply) => {
  try {
    await fastify.pg.query('SELECT 1'); 
    
    return reply.status(200).send({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    return reply.status(500).send({
      status: 'Error',
      database: 'Disconnected',
      message: 'A base de dados não está a responder.'
    });
  }
});

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