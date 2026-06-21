import { FastifyInstance } from 'fastify';

export interface QueryResult<R = any> {
  rows: R[];
  rowCount: number;
}

/** Minimal typed database client used across models (a pg PoolClient/Pool). */
export interface Db {
  query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>>;
}

type DbCallback<T> = (client: Db) => Promise<T>;

export async function withDb<T>(fastify: FastifyInstance, fn: DbCallback<T>): Promise<T> {
  const client = await fastify.pg.connect();
  try {
    return await fn(client as unknown as Db);
  } finally {
    client.release();
  }
}
