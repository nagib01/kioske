import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { loginSchema, validate } from '../../src/shared/validation.js';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/api/login', async (request, reply) => {
        let parsed: { email: string; senha: string };
        try {
            parsed = validate<{ email: string; senha: string }>(loginSchema, request.body);
        } catch (err: any) {
            return reply.status(err.statusCode || 400).send(err.body);
        }

        const { email, senha } = parsed;

        const result = await fastify.pg.query(
            'SELECT id, email, senha_hash, role, nome, avatar_url, escola_id FROM users WHERE email = $1',
            [email]
        );
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
            return reply.status(401).send({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });
        }

        const token = fastify.jwt.sign({
            id: user.id, email: user.email, role: user.role,
            nome: user.nome, avatar_url: user.avatar_url, escola_id: user.escola_id
        }, { expiresIn: '8h' });

        return reply.send({
            token, role: user.role, nome: user.nome,
            avatar_url: user.avatar_url, escola_id: user.escola_id
        });
    });
}
