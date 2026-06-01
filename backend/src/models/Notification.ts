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

        const notification = res.rows[0];
        this.enviarEmail(db, data.student_id, data.titulo, data.mensagem);

        return notification;
    }

    static async enviarEmail(db: any, studentId: string, titulo: string, mensagem?: string): Promise<void> {
        try {
            const { sendEmail, isEmailConfigured } = await import('../services/EmailService.js');
            if (!isEmailConfigured()) return;

            const res = await db.query('SELECT nome, email FROM students WHERE id = $1', [studentId]);
            const student = res.rows[0];
            if (!student?.email) return;

            const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#047857;">${titulo}</h2>
  <p style="font-size:14px;color:#333;line-height:1.6;">Ol&aacute; <strong>${student.nome}</strong>,</p>
  <p style="font-size:14px;color:#333;line-height:1.6;">${(mensagem || '').replace(/\n/g, '<br>')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
  <p style="font-size:12px;color:#999;">Kioske Digital Universal</p>
</div>`;

            await sendEmail({
                to: student.email,
                subject: `Kioske Digital - ${titulo}`,
                text: `${titulo}\n\nOlá ${student.nome},\n\n${mensagem || ''}\n\n---\nKioske Digital Universal`,
                html,
            });
        } catch {}
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
