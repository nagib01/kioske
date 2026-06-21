import type { Db } from '../shared/db.js';

export interface IUser {
    id: string;
    nome: string;
    email?: string;
    role: string;
    telefone?: string;
    avatar_url?: string;
    escola_id?: string;
    ativo: boolean;
    created_at: Date;
}

export class UserModel {
    static async listar(db: Db, escolaId: string, role?: string): Promise<IUser[]> {
        let query = 'SELECT id, nome, email, role, telefone, avatar_url, escola_id, ativo, created_at FROM users WHERE escola_id = $1';
        const params: unknown[] = [escolaId];
        if (role) {
            query += ' AND role = $2';
            params.push(role);
        }
        query += ' ORDER BY nome ASC';
        const res = await db.query(query, params);
        return res.rows;
    }

    static async buscarPorId(db: Db, id: string): Promise<IUser | null> {
        const res = await db.query(
            'SELECT id, nome, email, role, telefone, avatar_url, escola_id, ativo, created_at FROM users WHERE id = $1',
            [id]
        );
        return res.rows[0] || null;
    }

    static async buscarPorEmail(db: Db, email: string): Promise<IUser | null> {
        const res = await db.query(
            'SELECT id, nome, email, role, telefone, avatar_url, escola_id, ativo, created_at FROM users WHERE email = $1',
            [email]
        );
        return res.rows[0] || null;
    }

    static async criar(db: Db, escolaId: string, data: {
        nome: string;
        email?: string;
        senha_hash: string;
        role: string;
        telefone?: string;
    }): Promise<IUser> {
        const res = await db.query(
            `INSERT INTO users (escola_id, nome, email, senha_hash, role, telefone)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, role, telefone, avatar_url, escola_id, ativo, created_at`,
            [escolaId, data.nome, data.email || null, data.senha_hash, data.role, data.telefone || null]
        );
        return res.rows[0];
    }

    static async atualizar(db: Db, id: string, data: {
        nome?: string;
        email?: string;
        senha_hash?: string;
        role?: string;
        telefone?: string;
        ativo?: boolean;
    }): Promise<IUser | null> {
        const fields: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (data.nome !== undefined) { fields.push(`nome = $${idx++}`); params.push(data.nome); }
        if (data.email !== undefined) { fields.push(`email = $${idx++}`); params.push(data.email); }
        if (data.senha_hash !== undefined) { fields.push(`senha_hash = $${idx++}`); params.push(data.senha_hash); }
        if (data.role !== undefined) { fields.push(`role = $${idx++}`); params.push(data.role); }
        if (data.telefone !== undefined) { fields.push(`telefone = $${idx++}`); params.push(data.telefone); }
        if (data.ativo !== undefined) { fields.push(`ativo = $${idx++}`); params.push(data.ativo); }

        if (fields.length === 0) return this.buscarPorId(db, id);

        params.push(id);
        const res = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, nome, email, role, telefone, avatar_url, escola_id, ativo, created_at`,
            params
        );
        return res.rows[0] || null;
    }

    static async excluir(db: Db, id: string): Promise<boolean> {
        const res = await db.query(
            'UPDATE users SET ativo = false WHERE id = $1 RETURNING id',
            [id]
        );
        return res.rowCount > 0;
    }
}