import { FastifyInstance } from 'fastify';

type DbCallback<T> = (client: any) => Promise<T>;

export async function withDb<T>(fastify: FastifyInstance, fn: DbCallback<T>): Promise<T> {
  const client = await fastify.pg.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
