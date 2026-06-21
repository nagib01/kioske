import type { Db } from '../shared/db.js';

export interface IStudent {
    id: string;
    escola_id: string;
    numero_estudante: string;
    nome: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    data_nascimento?: string;
    documento_identificacao?: string;
    categoria: string;
    estado_formacao: string;
    data_matricula?: string;
    observacoes?: string;
    ativo: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IStudentContact {
    id: string;
    student_id: string;
    nome: string;
    parentesco?: string;
    telefone?: string;
    email?: string;
}

export interface ITrainingRecord {
    id: string;
    student_id: string;
    tipo: string;
    data: string;
    hora_inicio?: string;
    hora_fim?: string;
    car_id?: string;
    instructor_id?: string;
    summary?: string;
    status: string;
}

export class StudentModel {
    static async criar(db: Db, escolaId: string, data: {
        numero_estudante: string;
        nome: string;
        email?: string;
        telefone?: string;
        endereco?: string;
        data_nascimento?: string;
        documento_identificacao?: string;
        categoria?: string;
        estado_formacao?: string;
        data_matricula?: string;
        observacoes?: string;
        senha_hash?: string;
    }): Promise<IStudent> {
        const res = await db.query(
            `INSERT INTO students (escola_id, numero_estudante, nome, email, telefone, endereco, data_nascimento, documento_identificacao, categoria, estado_formacao, data_matricula, observacoes, senha_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [escolaId, data.numero_estudante, data.nome, data.email || null, data.telefone || null,
             data.endereco || null, data.data_nascimento || null, data.documento_identificacao || null,
             data.categoria || 'B', data.estado_formacao || 'inscrito', data.data_matricula || new Date().toISOString().split('T')[0],
             data.observacoes || null, data.senha_hash || null]
        );
        return res.rows[0];
    }

    static async atualizar(db: Db, id: string, data: Partial<{
        numero_estudante: string;
        nome: string;
        email: string;
        telefone: string;
        endereco: string;
        data_nascimento: string;
        documento_identificacao: string;
        categoria: string;
        estado_formacao: string;
        data_matricula: string;
        observacoes: string;
        ativo: boolean;
    }>): Promise<IStudent | null> {
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
            const res = await db.query('SELECT * FROM students WHERE id = $1', [id]);
            return res.rows[0] || null;
        }

        fields.push('updated_at = NOW()');
        values.unshift(id);

        const res = await db.query(
            `UPDATE students SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    static async buscarPorId(db: Db, id: string): Promise<IStudent | null> {
        const res = await db.query(
            `SELECT s.*, 
                (SELECT COUNT(*) FROM tickets t WHERE t.student_id = s.id) as total_tickets,
                (SELECT COUNT(*) FROM tickets t WHERE t.student_id = s.id AND t.status = 'finished') as tickets_concluidos,
                (SELECT COUNT(*) FROM training_records tr WHERE tr.student_id = s.id) as total_aulas,
                (SELECT COUNT(*) FROM training_records tr WHERE tr.student_id = s.id AND tr.status = 'concluida') as aulas_realizadas
             FROM students s WHERE s.id = $1`,
            [id]
        );
        return res.rows[0] || null;
    }

    static async listar(db: Db, escolaId: string, filters: {
        search?: string;
        categoria?: string;
        estado_formacao?: string;
        ativo?: boolean;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
    } = {}): Promise<{ students: IStudent[]; total: number }> {
        let where = 'WHERE s.escola_id = $1';
        const params: unknown[] = [escolaId];
        let paramIdx = 2;

        if (filters.search) {
            where += ` AND (s.nome ILIKE $${paramIdx} OR s.numero_estudante ILIKE $${paramIdx} OR s.email ILIKE $${paramIdx} OR s.telefone ILIKE $${paramIdx})`;
            params.push(`%${filters.search}%`);
            paramIdx++;
        }
        if (filters.categoria) {
            where += ` AND s.categoria = $${paramIdx++}`;
            params.push(filters.categoria);
        }
        if (filters.estado_formacao) {
            where += ` AND s.estado_formacao = $${paramIdx++}`;
            params.push(filters.estado_formacao);
        }
        if (filters.ativo !== undefined) {
            where += ` AND s.ativo = $${paramIdx++}`;
            params.push(filters.ativo);
        }

        const countRes = await db.query(`SELECT COUNT(*) FROM students s ${where}`, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const sort = filters.sort || 'created_at';
        const order = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const safeSort = ['nome', 'numero_estudante', 'categoria', 'estado_formacao', 'created_at', 'data_matricula'].includes(sort) ? sort : 'created_at';

        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 20));
        const offset = (page - 1) * limit;

        const res = await db.query(
            `SELECT s.*,
                (SELECT COUNT(*) FROM tickets t WHERE t.student_id = s.id) as total_tickets
             FROM students s ${where}
             ORDER BY s.${safeSort} ${order}
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limit, offset]
        );

        return { students: res.rows, total };
    }

    static async excluir(db: Db, id: string): Promise<boolean> {
        const res = await db.query('UPDATE students SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING id', [id]);
        return res.rowCount > 0;
    }

    static async dashboard(db: Db, escolaId: string): Promise<{
        total: number;
        ativos: number;
        por_estado: Record<string, number>;
        por_categoria: Record<string, number>;
        recentes: IStudent[];
    }> {
        const totalRes = await db.query('SELECT COUNT(*) FROM students WHERE escola_id = $1', [escolaId]);
        const total = parseInt(totalRes.rows[0].count, 10);

        const ativosRes = await db.query('SELECT COUNT(*) FROM students WHERE escola_id = $1 AND ativo = true', [escolaId]);
        const ativos = parseInt(ativosRes.rows[0].count, 10);

        const estadoRes = await db.query(
            'SELECT estado_formacao, COUNT(*)::int as count FROM students WHERE escola_id = $1 GROUP BY estado_formacao ORDER BY count DESC',
            [escolaId]
        );
        const por_estado: Record<string, number> = {};
        for (const row of estadoRes.rows) {
            por_estado[row.estado_formacao] = row.count;
        }

        const categoriaRes = await db.query(
            'SELECT categoria, COUNT(*)::int as count FROM students WHERE escola_id = $1 GROUP BY categoria ORDER BY count DESC',
            [escolaId]
        );
        const por_categoria: Record<string, number> = {};
        for (const row of categoriaRes.rows) {
            por_categoria[row.categoria] = row.count;
        }

        const recentesRes = await db.query(
            'SELECT * FROM students WHERE escola_id = $1 ORDER BY created_at DESC LIMIT 5',
            [escolaId]
        );

        return { total, ativos, por_estado, por_categoria, recentes: recentesRes.rows };
    }

    // Contacts
    static async listarContactos(db: Db, studentId: string): Promise<IStudentContact[]> {
        const res = await db.query(
            'SELECT * FROM student_contacts WHERE student_id = $1 ORDER BY created_at ASC',
            [studentId]
        );
        return res.rows;
    }

    static async adicionarContacto(db: Db, studentId: string, data: {
        nome: string;
        parentesco?: string;
        telefone?: string;
        email?: string;
    }): Promise<IStudentContact> {
        const res = await db.query(
            `INSERT INTO student_contacts (student_id, nome, parentesco, telefone, email)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [studentId, data.nome, data.parentesco || null, data.telefone || null, data.email || null]
        );
        return res.rows[0];
    }

    static async removerContacto(db: Db, contactId: string): Promise<boolean> {
        const res = await db.query('DELETE FROM student_contacts WHERE id = $1 RETURNING id', [contactId]);
        return res.rowCount > 0;
    }

    // Tickets association
    static async tickets(db: Db, studentId: string): Promise<any[]> {
        const res = await db.query(
            `SELECT t.*, s.nome as servico_nome
             FROM tickets t
             JOIN servicos s ON s.id = t.servico_id
             WHERE t.student_id = $1
             ORDER BY t.created_at DESC`,
            [studentId]
        );
        return res.rows;
    }

    static async associarTicket(db: Db, ticketId: string, studentId: string): Promise<boolean> {
        const res = await db.query(
            'UPDATE tickets SET student_id = $1 WHERE id = $2 RETURNING id',
            [studentId, ticketId]
        );
        return res.rowCount > 0;
    }
}
