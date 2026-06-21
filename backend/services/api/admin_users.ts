import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { authAdmin } from '../../src/shared/auth.js';
import { validate, validateBody, createUserSchema, updateUserSchema } from '../../src/shared/validation.js';
import { withDb } from '../../src/shared/db.js';
import { UserModel } from '../../src/models/User.js';

export async function adminUserRoutes(fastify: FastifyInstance) {

  // GET /admin/users - List all users (filter by role)
  fastify.get('/admin/users', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id;
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });
    const { role } = request.query as any;
    return withDb(fastify, async (client) => {
      const users = await UserModel.listar(client, escolaId, role || undefined);
      return reply.send(users);
    });
  });

  // GET /admin/users/:id - Get user detail
  fastify.get('/admin/users/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const user = await UserModel.buscarPorId(client, id);
      if (!user) return reply.status(404).send({ error: 'Utilizador não encontrado' });
      return reply.send(user);
    });
  });

  // POST /admin/users - Create user
  fastify.post('/admin/users', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const escolaId = request.user.escola_id;
    if (!escolaId) return reply.status(400).send({ error: 'escolaId é necessário' });

    const parsed = validateBody(createUserSchema, request.body, reply); if (parsed === undefined) return;

    return withDb(fastify, async (client) => {
      if (parsed.email) {
        const existing = await UserModel.buscarPorEmail(client, parsed.email);
        if (existing) return reply.status(409).send({ error: 'Email já registado' });
      }

      const senha_hash = await bcrypt.hash(parsed.senha, 10);
      const user = await UserModel.criar(client, escolaId, {
        nome: parsed.nome,
        email: parsed.email || undefined,
        senha_hash,
        role: parsed.role,
        telefone: parsed.telefone || undefined,
      });

      return reply.status(201).send(user);
    });
  });

  // PUT /admin/users/:id - Update user
  fastify.put('/admin/users/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;

    const parsed = validateBody(updateUserSchema, request.body, reply); if (parsed === undefined) return;

    return withDb(fastify, async (client) => {
      const existing = await UserModel.buscarPorId(client, id);
      if (!existing) return reply.status(404).send({ error: 'Utilizador não encontrado' });

      if (parsed.email && parsed.email !== existing.email) {
        const emailUser = await UserModel.buscarPorEmail(client, parsed.email);
        if (emailUser) return reply.status(409).send({ error: 'Email já registado' });
      }

      const updateData: any = {};
      if (parsed.nome !== undefined) updateData.nome = parsed.nome;
      if (parsed.email !== undefined) updateData.email = parsed.email || null;
      if (parsed.role !== undefined) updateData.role = parsed.role;
      if (parsed.telefone !== undefined) updateData.telefone = parsed.telefone || null;
      if (parsed.ativo !== undefined) updateData.ativo = parsed.ativo;
      if (parsed.senha) {
        updateData.senha_hash = await bcrypt.hash(parsed.senha, 10);
      }

      const user = await UserModel.atualizar(client, id, updateData);
      return reply.send(user);
    });
  });

  // DELETE /admin/users/:id - Soft delete (deactivate)
  fastify.delete('/admin/users/:id', async (request: any, reply) => {
    if (!(await authAdmin(request, reply))) return;
    const { id } = request.params as any;
    return withDb(fastify, async (client) => {
      const existing = await UserModel.buscarPorId(client, id);
      if (!existing) return reply.status(404).send({ error: 'Utilizador não encontrado' });
      if (existing.id === request.user.id.toString()) {
        return reply.status(400).send({ error: 'Não pode desativar a si próprio' });
      }
      const ok = await UserModel.excluir(client, id);
      return reply.send({ success: true });
    });
  });
}