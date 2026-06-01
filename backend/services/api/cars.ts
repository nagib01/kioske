import { FastifyInstance } from 'fastify';
import { authAdmin, authInstructor } from '../../src/shared/auth.js';
import { getDefaultEscolaId } from '../../src/shared/escola.js';
import { validate, carSchema, carUpdateSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';
import { CarModel } from '../../src/models/Car.js';

export async function carRoutes(fastify: FastifyInstance) {

  // GET /admin/cars - List all cars (admin)
  fastify.get('/admin/cars', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
    const { ativo } = request.query as any;
    return withDb(fastify, async (client) => {
      const cars = await CarModel.listar(client, escolaId, {
        ativo: ativo !== undefined ? ativo === 'true' || ativo === true : undefined,
      });
      return reply.send(cars);
    });
  });

  // POST /admin/cars - Create car
  fastify.post('/admin/cars', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
    let parsed: any;
    try { parsed = validate(carSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    return withDb(fastify, async (client) => {
      try {
        const car = await CarModel.criar(client, escolaId, parsed);
        return reply.status(201).send(car);
      } catch (err: any) {
        if (err.code === '23505') return reply.status(409).send({ error: 'Matrícula já existe nesta escola' });
        throw err;
      }
    });
  });

  // PUT /admin/cars/:id - Update car
  fastify.put('/admin/cars/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    let parsed: any;
    try { parsed = validate(carUpdateSchema, request.body); } catch (err: any) { return reply.status(err.statusCode || 400).send(err.body); }
    return withDb(fastify, async (client) => {
      const car = await CarModel.atualizar(client, id, parsed);
      if (!car) return reply.status(404).send({ error: 'Viatura não encontrada' });
      return reply.send(car);
    });
  });

  // DELETE /admin/cars/:id - Soft delete car
  fastify.delete('/admin/cars/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const ok = await CarModel.excluir(client, id);
      if (!ok) return reply.status(404).send({ error: 'Viatura não encontrada' });
      return reply.send({ success: true });
    });
  });

  // GET /api/instructor/cars - List available cars (instructor)
  fastify.get('/api/instructor/cars', async (request: any, reply) => {
    if (!(await authInstructor(request, reply))) return;
    const escolaId = request.user.escola_id || (await getDefaultEscolaId(fastify));
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
    return withDb(fastify, async (client) => {
      const cars = await CarModel.listar(client, escolaId, { ativo: true });
      return reply.send(cars);
    });
  });
}
