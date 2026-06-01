export interface INotification {
    id: string;
    student_id: string;
    tipo: string;
    titulo: string;
    mensagem?: string;
    lesson_id?: string;
    lida: boolean;
    created_at: Date;
}

export class NotificationModel {
    static async listar(db: any, studentId: string): Promise<INotification[]> {
        const res = await db.query(
            `SELECT * FROM student_notifications
             WHERE student_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [studentId]
        );
        return res.rows;
    }

    static async criar(db: any, data: {
        student_id: string;
        tipo: string;
        titulo: string;
        mensagem?: string;
        lesson_id?: string;
    }): Promise<INotification> {
        const res = await db.query(
            `INSERT INTO student_notifications (student_id, tipo, titulo, mensagem, lesson_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [data.student_id, data.tipo, data.titulo, data.mensagem || null, data.lesson_id || null]
        );
        return res.rows[0];
    }

    static async marcarLida(db: any, id: string, studentId: string): Promise<boolean> {
        const res = await db.query(
            'UPDATE student_notifications SET lida = true WHERE id = $1 AND student_id = $2 RETURNING id',
            [id, studentId]
        );
        return res.rowCount > 0;
    }

    static async marcarTodasLidas(db: any, studentId: string): Promise<boolean> {
        await db.query(
            'UPDATE student_notifications SET lida = true WHERE student_id = $1 AND lida = false',
            [studentId]
        );
        return true;
    }

    static async contarNaoLidas(db: any, studentId: string): Promise<number> {
        const res = await db.query(
            'SELECT COUNT(*) FROM student_notifications WHERE student_id = $1 AND lida = false',
            [studentId]
        );
        return parseInt(res.rows[0].count, 10);
    }
}
