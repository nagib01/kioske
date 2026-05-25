import { FastifyInstance } from 'fastify';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

export async function runMigrations(fastify: FastifyInstance) {
  await fastify.pg.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )`
  );

  const { rows: applied } = await fastify.pg.query('SELECT name FROM _migrations ORDER BY name');
  const appliedSet = new Set(applied.map((r: any) => r.name));

  let files: string[];
  try {
    files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  } catch {
    fastify.log.info('Nenhuma migração encontrada');
    return;
  }

  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    try {
      await fastify.pg.query('BEGIN');
      await fastify.pg.query(sql);
      await fastify.pg.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await fastify.pg.query('COMMIT');
      fastify.log.info(`Migração aplicada: ${file}`);
    } catch (err) {
      await fastify.pg.query('ROLLBACK');
      fastify.log.error({ msg: `Erro na migração ${file}`, err });
      throw err;
    }
  }
}
