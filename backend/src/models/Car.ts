import type { Db } from '../shared/db.js';

export interface ICar {
    id: string;
    escola_id: string;
    matricula: string;
    marca: string;
    modelo: string;
    ano?: number;
    categoria: string;
    observacoes?: string;
    ativo: boolean;
    created_at: Date;
}

export class CarModel {
    static async listar(db: Db, escolaId: string, filters: { ativo?: boolean } = {}): Promise<ICar[]> {
        let query = 'SELECT * FROM cars WHERE escola_id = $1';
        const params: unknown[] = [escolaId];
        if (filters.ativo !== undefined) {
            query += ' AND ativo = $2';
            params.push(filters.ativo);
        }
        query += ' ORDER BY matricula ASC';
        const res = await db.query(query, params);
        return res.rows;
    }

    static async buscarPorId(db: Db, id: string): Promise<ICar | null> {
        const res = await db.query('SELECT * FROM cars WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async criar(db: Db, escolaId: string, data: {
        matricula: string;
        marca: string;
        modelo: string;
        ano?: number;
        categoria: string;
        observacoes?: string;
    }): Promise<ICar> {
        const res = await db.query(
            `INSERT INTO cars (escola_id, matricula, marca, modelo, ano, categoria, observacoes)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [escolaId, data.matricula, data.marca, data.modelo, data.ano || null, data.categoria, data.observacoes || null]
        );
        return res.rows[0];
    }

    static async atualizar(db: Db, id: string, data: Partial<{
        matricula: string;
        marca: string;
        modelo: string;
        ano: number;
        categoria: string;
        observacoes: string;
        ativo: boolean;
    }>): Promise<ICar | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 2;

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = $${idx++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            const res = await db.query('SELECT * FROM cars WHERE id = $1', [id]);
            return res.rows[0] || null;
        }

        values.unshift(id);
        const res = await db.query(
            `UPDATE cars SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    static async excluir(db: Db, id: string): Promise<boolean> {
        const res = await db.query('UPDATE cars SET ativo = false WHERE id = $1 RETURNING id', [id]);
        return res.rowCount > 0;
    }
}
