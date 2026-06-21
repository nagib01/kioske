import type { Db } from '../shared/db.js';

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
    static async listar(db: Db, studentId: string): Promise<INotification[]> {
        const res = await db.query(
            `SELECT * FROM student_notifications
             WHERE student_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [studentId]
        );
        return res.rows;
    }

    static async criar(db: Db, data: {
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
        await this.enviarEmail(db, data.student_id, data.titulo, data.mensagem, data.lesson_id);

        return notification;
    }

    static async enviarEmail(db: Db, studentId: string, titulo: string, mensagem?: string, lessonId?: string): Promise<void> {
        try {
            const { sendEmail, isEmailConfigured } = await import('../services/EmailService.js');
            if (!isEmailConfigured()) {
                console.warn(`[Email] Email não configurado. SMTP_HOST=${process.env.SMTP_HOST ? '✓' : '✗'} SMTP_USER=${process.env.SMTP_USER ? '✓' : '✗'}`);
                return;
            }

            const studentRes = await db.query('SELECT nome, email FROM students WHERE id = $1', [studentId]);
            const student = studentRes.rows[0];
            if (!student?.email) {
                console.warn(`[Email] Aluno ${studentId} não tem email definido`);
                return;
            }

            let extraHtml = '';
            let extraText = '';
            if (lessonId) {
                const lessonRes = await db.query(
                    `SELECT tr.tipo, tr.data, tr.hora_inicio, tr.hora_fim, tr.categoria,
                            u.nome as instructor_nome, c.matricula as car_matricula
                     FROM training_records tr
                     LEFT JOIN users u ON u.id = tr.instructor_id
                     LEFT JOIN cars c ON c.id = tr.car_id
                     WHERE tr.id = $1`,
                    [lessonId]
                );
                const lesson = lessonRes.rows[0];
                if (lesson) {
                    const tipoLabel = lesson.tipo === 'pratica' ? 'Prática' : 'Teórica';
                    const dataFormatada = new Date(lesson.data).toLocaleDateString('pt-PT');
                    const horaInicio = lesson.hora_inicio ? lesson.hora_inicio.substring(0, 5) : '--:--';
                    const horaFim = lesson.hora_fim ? lesson.hora_fim.substring(0, 5) : '--:--';

                    extraHtml = `
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;width:120px;">Tipo</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${tipoLabel}${lesson.categoria ? ` (Categoria ${lesson.categoria})` : ''}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;">Data</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${dataFormatada}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;">Horário</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${horaInicio} – ${horaFim}</td></tr>
      ${lesson.instructor_nome ? `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;">Instrutor</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lesson.instructor_nome}</td></tr>` : ''}
      ${lesson.car_matricula ? `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;">Viatura</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lesson.car_matricula}</td></tr>` : ''}
    </table>`;

                    extraText = [
                        `Tipo: ${tipoLabel}${lesson.categoria ? ` (Categoria ${lesson.categoria})` : ''}`,
                        `Data: ${dataFormatada}`,
                        `Horário: ${horaInicio} – ${horaFim}`,
                        lesson.instructor_nome ? `Instrutor: ${lesson.instructor_nome}` : '',
                        lesson.car_matricula ? `Viatura: ${lesson.car_matricula}` : '',
                    ].filter(Boolean).join('\n');
                }
            }

            const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#047857;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:20px;">${titulo}</h1>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px;">
    <p style="font-size:15px;color:#374151;line-height:1.6;">Ol&aacute; <strong>${student.nome}</strong>,</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;">${(mensagem || '').replace(/\n/g, '<br>')}</p>
    ${extraHtml}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-top:16px;">
      <p style="margin:0;font-size:13px;color:#166534;">
        <strong>💡 Nota:</strong> Caso n&atilde;o possa comparecer, contacte a escola com anteced&ecirc;ncia para remarca&ccedil;&atilde;o.
      </p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="font-size:12px;color:#9ca3af;text-align:center;">Kioske Digital Universal &mdash; O seu centro de forma&ccedil;&atilde;o</p>
  </div>
</div>`;

            const text = `${titulo}\n\nOlá ${student.nome},\n\n${mensagem || ''}\n${extraText ? `\n${extraText}` : ''}\n\n---\nKioske Digital Universal`;

            await sendEmail({
                to: student.email,
                subject: `Kioske Digital - ${titulo}`,
                text,
                html,
            });
        } catch (err) {
            console.error(`[Email] Falha ao enviar email para aluno ${studentId}:`, err);
        }
    }

    static async marcarLida(db: Db, id: string, studentId: string): Promise<boolean> {
        const res = await db.query(
            'UPDATE student_notifications SET lida = true WHERE id = $1 AND student_id = $2 RETURNING id',
            [id, studentId]
        );
        return res.rowCount > 0;
    }

    static async marcarTodasLidas(db: Db, studentId: string): Promise<boolean> {
        await db.query(
            'UPDATE student_notifications SET lida = true WHERE student_id = $1 AND lida = false',
            [studentId]
        );
        return true;
    }

    static async contarNaoLidas(db: Db, studentId: string): Promise<number> {
        const res = await db.query(
            'SELECT COUNT(*) FROM student_notifications WHERE student_id = $1 AND lida = false',
            [studentId]
        );
        return parseInt(res.rows[0].count, 10);
    }
}
