export interface ILesson {
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
    created_at: Date;
}

export interface ILessonWithJoins extends ILesson {
    student_nome: string;
    student_numero_estudante: string;
    car_matricula?: string;
    instructor_nome?: string;
}

export class LessonModel {
    static async buscarPorId(db: any, id: string): Promise<ILessonWithJoins | null> {
        const res = await db.query(
            `SELECT tr.*,
                s.nome as student_nome,
                s.numero_estudante as student_numero_estudante,
                c.matricula as car_matricula,
                u.nome as instructor_nome
             FROM training_records tr
             JOIN students s ON s.id = tr.student_id
             LEFT JOIN cars c ON c.id = tr.car_id
             LEFT JOIN users u ON u.id = tr.instructor_id
             WHERE tr.id = $1`,
            [id]
        );
        return res.rows[0] || null;
    }

    static async listarPorAluno(db: any, studentId: string): Promise<ILessonWithJoins[]> {
        const res = await db.query(
            `SELECT tr.*,
                s.nome as student_nome,
                s.numero_estudante as student_numero_estudante,
                c.matricula as car_matricula,
                u.nome as instructor_nome
             FROM training_records tr
             JOIN students s ON s.id = tr.student_id
             LEFT JOIN cars c ON c.id = tr.car_id
             LEFT JOIN users u ON u.id = tr.instructor_id
             WHERE tr.student_id = $1
             ORDER BY tr.data DESC, tr.created_at DESC`,
            [studentId]
        );
        return res.rows;
    }

    static async listarPorInstrutor(db: any, instructorId: string, filters: {
        data_inicio?: string;
        data_fim?: string;
        status?: string;
    } = {}): Promise<ILessonWithJoins[]> {
        let query = `SELECT tr.*,
                s.nome as student_nome,
                s.numero_estudante as student_numero_estudante,
                c.matricula as car_matricula,
                u.nome as instructor_nome
             FROM training_records tr
             JOIN students s ON s.id = tr.student_id
             LEFT JOIN cars c ON c.id = tr.car_id
             LEFT JOIN users u ON u.id = tr.instructor_id
             WHERE tr.instructor_id = $1`;
        const params: unknown[] = [instructorId];
        let idx = 2;

        if (filters.data_inicio) {
            query += ` AND tr.data >= $${idx++}`;
            params.push(filters.data_inicio);
        }
        if (filters.data_fim) {
            query += ` AND tr.data <= $${idx++}`;
            params.push(filters.data_fim);
        }
        if (filters.status) {
            query += ` AND tr.status = $${idx++}`;
            params.push(filters.status);
        }

        query += ' ORDER BY tr.data DESC, tr.hora_inicio ASC';
        const res = await db.query(query, params);
        return res.rows;
    }

    static async listarTodos(db: any, escolaId: string, filters: {
        search?: string;
        instructor_id?: string;
        student_id?: string;
        car_id?: string;
        data_inicio?: string;
        data_fim?: string;
        status?: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
    } = {}): Promise<{ lessons: ILessonWithJoins[]; total: number }> {
        let where = 'WHERE s.escola_id = $1';
        const params: unknown[] = [escolaId];
        let idx = 2;

        if (filters.search) {
            where += ` AND (s.nome ILIKE $${idx} OR s.numero_estudante ILIKE $${idx} OR c.matricula ILIKE $${idx} OR u.nome ILIKE $${idx})`;
            params.push(`%${filters.search}%`);
            idx++;
        }
        if (filters.instructor_id) {
            where += ` AND tr.instructor_id = $${idx++}`;
            params.push(filters.instructor_id);
        }
        if (filters.student_id) {
            where += ` AND tr.student_id = $${idx++}`;
            params.push(filters.student_id);
        }
        if (filters.car_id) {
            where += ` AND tr.car_id = $${idx++}`;
            params.push(filters.car_id);
        }
        if (filters.data_inicio) {
            where += ` AND tr.data >= $${idx++}`;
            params.push(filters.data_inicio);
        }
        if (filters.data_fim) {
            where += ` AND tr.data <= $${idx++}`;
            params.push(filters.data_fim);
        }
        if (filters.status) {
            where += ` AND tr.status = $${idx++}`;
            params.push(filters.status);
        }

        const baseQuery = `FROM training_records tr
             JOIN students s ON s.id = tr.student_id
             LEFT JOIN cars c ON c.id = tr.car_id
             LEFT JOIN users u ON u.id = tr.instructor_id`;

        const countRes = await db.query(`SELECT COUNT(*) ${baseQuery} ${where}`, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const sort = filters.sort || 'data';
        const order = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const safeSort = ['data', 'hora_inicio', 'created_at', 'status'].includes(sort) ? `tr.${sort}` : 'tr.data';

        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 20));
        const offset = (page - 1) * limit;

        const res = await db.query(
            `SELECT tr.*, s.nome as student_nome, s.numero_estudante as student_numero_estudante,
                c.matricula as car_matricula, u.nome as instructor_nome
             ${baseQuery} ${where}
             ORDER BY ${safeSort} ${order}
             LIMIT $${idx} OFFSET $${idx + 1}`,
            [...params, limit, offset]
        );

        return { lessons: res.rows, total };
    }

    static async criar(db: any, data: {
        student_id: string;
        tipo: string;
        data: string;
        hora_inicio: string;
        hora_fim: string;
        car_id?: string;
        instructor_id?: string;
        summary?: string;
        status?: string;
    }): Promise<ILesson> {
        const res = await db.query(
            `INSERT INTO training_records (student_id, tipo, data, hora_inicio, hora_fim, car_id, instructor_id, summary, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [data.student_id, data.tipo, data.data, data.hora_inicio, data.hora_fim,
             data.car_id || null, data.instructor_id || null, data.summary || null, data.status || 'agendada']
        );
        return res.rows[0];
    }

    static async atualizar(db: any, id: string, data: Partial<{
        student_id: string;
        tipo: string;
        data: string;
        hora_inicio: string;
        hora_fim: string;
        car_id: string;
        instructor_id: string;
        summary: string;
        status: string;
    }>): Promise<ILesson | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 2;

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = $${idx++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.unshift(id);
        const res = await db.query(
            `UPDATE training_records SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    static async excluir(db: any, id: string): Promise<boolean> {
        const res = await db.query('DELETE FROM training_records WHERE id = $1 RETURNING id', [id]);
        return res.rowCount > 0;
    }

    static async verificarConflitoInstrutor(db: any, instructorId: string, data: string, horaInicio: string, horaFim: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT id FROM training_records
             WHERE instructor_id = $1 AND data = $2 AND status != 'cancelada'
             AND hora_inicio < $4 AND hora_fim > $3`;
        const params: unknown[] = [instructorId, data, horaInicio, horaFim];
        let idx = 5;
        if (excludeId) {
            query += ` AND id != $${idx}`;
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const res = await db.query(query, params);
        return res.rowCount > 0;
    }

    static async verificarConflitoCarro(db: any, carId: string, data: string, horaInicio: string, horaFim: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT id FROM training_records
             WHERE car_id = $1 AND data = $2 AND status != 'cancelada'
             AND hora_inicio < $4 AND hora_fim > $3`;
        const params: unknown[] = [carId, data, horaInicio, horaFim];
        let idx = 5;
        if (excludeId) {
            query += ` AND id != $${idx}`;
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const res = await db.query(query, params);
        return res.rowCount > 0;
    }

    static async dashboardInstrutor(db: any, instructorId: string): Promise<{
        aulas_hoje: number;
        horas_hoje: string;
        proximas_aulas: ILessonWithJoins[];
        aulas_em_curso: number;
        contagem_status: Record<string, number>;
    }> {
        const hoje = new Date().toISOString().split('T')[0];

        const aulasHojeRes = await db.query(
            `SELECT COUNT(*) FROM training_records WHERE instructor_id = $1 AND data = $2`,
            [instructorId, hoje]
        );
        const aulas_hoje = parseInt(aulasHojeRes.rows[0].count, 10);

        const horasRes = await db.query(
            `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (hora_fim - hora_inicio)) / 3600), 0) as horas
             FROM training_records WHERE instructor_id = $1 AND data = $2 AND status != 'cancelada'`,
            [instructorId, hoje]
        );
        const horas_hoje = parseFloat(horasRes.rows[0].horas).toFixed(1);

        const proximasRes = await db.query(
            `SELECT tr.*, s.nome as student_nome, s.numero_estudante as student_numero_estudante,
                c.matricula as car_matricula, u.nome as instructor_nome
             FROM training_records tr
             JOIN students s ON s.id = tr.student_id
             LEFT JOIN cars c ON c.id = tr.car_id
             LEFT JOIN users u ON u.id = tr.instructor_id
             WHERE tr.instructor_id = $1 AND tr.data >= $2 AND tr.status IN ('agendada', 'em_curso')
             ORDER BY tr.data ASC, tr.hora_inicio ASC
             LIMIT 5`,
            [instructorId, hoje]
        );

        const emCursoRes = await db.query(
            `SELECT COUNT(*) FROM training_records WHERE instructor_id = $1 AND data = $2 AND status = 'em_curso'`,
            [instructorId, hoje]
        );

        const statusRes = await db.query(
            `SELECT status, COUNT(*)::int as count FROM training_records WHERE instructor_id = $1 GROUP BY status`,
            [instructorId]
        );
        const contagem_status: Record<string, number> = {};
        for (const row of statusRes.rows) {
            contagem_status[row.status] = row.count;
        }

        return {
            aulas_hoje,
            horas_hoje,
            proximas_aulas: proximasRes.rows,
            aulas_em_curso: parseInt(emCursoRes.rows[0].count, 10),
            contagem_status,
        };
    }
}
