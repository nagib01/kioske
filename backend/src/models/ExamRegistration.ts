import type { Db } from '../shared/db.js';

export interface IExamRegistration {
    id: string;
    student_id: string;
    exam_type: string;
    status: string;
    passed: boolean | null;
    score: number | null;
    exam_date: string;
    instructor_id?: string;
    car_id?: string;
    notes?: string;
    created_at: Date;
}

export interface IExamRegistrationWithJoins extends IExamRegistration {
    student_nome: string;
    student_numero_estudante: string;
    instructor_nome?: string;
    car_matricula?: string;
}

export class ExamRegistrationModel {
    static async listarPorAluno(db: Db, studentId: string): Promise<IExamRegistrationWithJoins[]> {
        const res = await db.query(
            `SELECT er.*, u.nome as instructor_nome, c.matricula as car_matricula
             FROM exam_registrations er
             LEFT JOIN users u ON u.id = er.instructor_id
             LEFT JOIN cars c ON c.id = er.car_id
             WHERE er.student_id = $1
             ORDER BY er.exam_date DESC, er.created_at DESC`,
            [studentId]
        );
        return res.rows;
    }

    static async criar(db: Db, data: {
        student_id: string;
        exam_type: string;
        exam_date: string;
        instructor_id?: string;
        car_id?: string;
        notes?: string;
    }): Promise<IExamRegistration> {
        const res = await db.query(
            `INSERT INTO exam_registrations (student_id, exam_type, exam_date, instructor_id, car_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [data.student_id, data.exam_type, data.exam_date,
             data.instructor_id || null, data.car_id || null, data.notes || null]
        );
        return res.rows[0];
    }

    static async buscarPorId(db: Db, id: string): Promise<IExamRegistrationWithJoins | null> {
        const res = await db.query(
            `SELECT er.*, u.nome as instructor_nome, c.matricula as car_matricula
             FROM exam_registrations er
             LEFT JOIN users u ON u.id = er.instructor_id
             LEFT JOIN cars c ON c.id = er.car_id
             WHERE er.id = $1`,
            [id]
        );
        return res.rows[0] || null;
    }

    static async atualizar(db: Db, id: string, data: Partial<{
        exam_type: string;
        status: string;
        passed: boolean;
        score: number;
        exam_date: string;
        instructor_id: string;
        car_id: string;
        notes: string;
    }>): Promise<IExamRegistration | null> {
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
            `UPDATE exam_registrations SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    static async excluir(db: Db, id: string): Promise<boolean> {
        const res = await db.query('DELETE FROM exam_registrations WHERE id = $1 RETURNING id', [id]);
        return res.rowCount > 0;
    }
}