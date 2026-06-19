import { QueryResult } from 'pg';

export interface ITicket {
    id: string;
    escola_id: string;
    servico_id: string;
    codigo_senha: string;
    posicao: number;
    priority: boolean;
    priority_level: number; // 0=normal, 1=medium, 2=urgent
    alertas: string[];
    status: 'waiting' | 'called' | 'finished';
    aluno_token: string;
    aluno_nome?: string;
    mesa_atendimento?: string;
    triagem_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class TicketModel {
    private static formatarSenha(prefixo: string, numero: number) {
        return `${prefixo}-${String(numero).padStart(3, '0')}`;
    }

    private static prioridadeValor(priorityLevel: 'high' | 'medium' | 'normal') {
        if (priorityLevel === 'high') return 2;
        if (priorityLevel === 'medium') return 1;
        return 0;
    }

    private static prioridadeSqlOrder() {
        return 'priority_level';
    }

    /**
     * Cria um ticket para o serviço e escola indicados.
     * Gera `aluno_token` automaticamente se não fornecido.
     * Retry automático em caso de deadlock (código 40P01 / 55P03).
     */
    static async criar(db: any, escolaId: string, servicoId: string, data: {
        priority?: boolean;
        priority_level?: number | 'high' | 'medium' | 'normal';
        alertas?: string[];
        aluno_token?: string;
        aluno_nome?: string;
        student_id?: string;
    } = {}): Promise<ITicket> {
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await this._criar(db, escolaId, servicoId, data);
            } catch (err: any) {
                const isDeadlock = err.code === '40P01' || err.code === '55P03';
                if (isDeadlock && attempt < MAX_RETRIES) {
                    continue;
                }
                throw err;
            }
        }
        throw new Error('Max retries exceeded');
    }

    private static async _criar(db: any, escolaId: string, servicoId: string, data: {
        priority?: boolean;
        priority_level?: number | 'high' | 'medium' | 'normal';
        alertas?: string[];
        aluno_token?: string;
        aluno_nome?: string;
        student_id?: string;
    }): Promise<ITicket> {
        const alunoToken = data.aluno_token || null;
        const priorityLevel = typeof data.priority_level === 'number'
            ? data.priority_level
            : this.prioridadeValor(data.priority_level || (data.priority ? 'high' : 'normal'));
        const priority = priorityLevel >= 2;
        const alertas = Array.isArray(data.alertas) ? data.alertas : [];

        await db.query('BEGIN');
        try {
            const servicoRes: QueryResult = await db.query(
                `SELECT codigo_prefixo, proximo_numero, mesa_padrao FROM servicos WHERE id = $1 FOR UPDATE`,
                [servicoId]
            );

            if (!servicoRes.rows.length) {
                throw new Error('Serviço não encontrado para gerar senha');
            }

            const prefixo: string = servicoRes.rows[0].codigo_prefixo || 'A';
            const proximoNumero: number = Number(servicoRes.rows[0].proximo_numero || 1);
            const codigoSenha = this.formatarSenha(prefixo, proximoNumero);
            const mesaAtendimento = servicoRes.rows[0].mesa_padrao || '01';

            const result: QueryResult = await db.query(
            `INSERT INTO tickets (
                escola_id,
                servico_id,
                codigo_senha,
                priority,
                priority_level,
                alertas,
                triagem_at,
                aluno_token,
                mesa_atendimento,
                aluno_nome,
                student_id
            )
             VALUES (
                $1, $2, $3, $4, $5,
                COALESCE($6, '[]'::jsonb),
                NOW(),
                COALESCE($7, gen_random_uuid()),
                $8, $9, $10
             )
             RETURNING *`,
            [
                escolaId,
                servicoId,
                codigoSenha,
                priority,
                priorityLevel,
                JSON.stringify(alertas),
                alunoToken,
                mesaAtendimento,
                data.aluno_nome || null,
                data.student_id || null,
            ]
        );

        await db.query(
            `UPDATE servicos SET proximo_numero = $2 WHERE id = $1`,
            [servicoId, proximoNumero + 1]
        );

        const ticket = result.rows[0];
        await this.atualizarPosicoesFila(db, servicoId);

        const res2 = await db.query(`SELECT * FROM tickets WHERE id = $1`, [ticket.id]);
        await db.query('COMMIT');
        return res2.rows[0] as ITicket;
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    }

    static async guardarRespostasTriagem(db: any, ticketId: string, respostas: Array<{
        perguntaId?: string;
        perguntaTexto?: string;
        respostaValor?: string;
        respostaLabel?: string;
    }>) {
        if (!Array.isArray(respostas) || respostas.length === 0) return;

        for (const item of respostas) {
            await db.query(
                `INSERT INTO ticket_triage_answers (ticket_id, question_id, question_text, answer_value, answer_label)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    ticketId,
                    item.perguntaId || null,
                    item.perguntaTexto || null,
                    item.respostaValor || null,
                    item.respostaLabel || null
                ]
            );
        }
    }

    static async atualizarPosicoesFila(db: any, servicoId: string) {
        await db.query(
            `WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY ${this.prioridadeSqlOrder()} DESC, created_at ASC) as nova_pos
                FROM tickets
                WHERE servico_id = $1 AND status = 'waiting'
            )
            UPDATE tickets
            SET posicao = ranked.nova_pos
            FROM ranked
            WHERE tickets.id = ranked.id`,
            [servicoId]
        );
    }

    static async buscarFilaPorServico(db: any, servicoId: string) {
        const res = await db.query(
            `SELECT t.*, s.nome as servico_nome
             FROM tickets t
             JOIN servicos s ON s.id = t.servico_id
             WHERE t.servico_id = $1 AND t.status IN ('waiting','called')
             ORDER BY ${this.prioridadeSqlOrder()} DESC, t.created_at ASC`,
            [servicoId]
        );
        return res.rows as ITicket[];
    }

    static async buscarFilaPorEscola(db: any, escolaId: string) {
        const res = await db.query(
            `SELECT t.*, s.nome as servico_nome
             FROM tickets t
             JOIN servicos s ON s.id = t.servico_id
             WHERE t.escola_id = $1 AND t.status IN ('waiting','called')
             ORDER BY ${this.prioridadeSqlOrder()} DESC, t.created_at ASC`,
            [escolaId]
        );
        return res.rows as ITicket[];
    }

    static async chamarTicket(db: any, ticketId: string, mesa?: string) {
        const res = await db.query(
            `UPDATE tickets SET status = 'called', updated_at = NOW(), mesa_atendimento = COALESCE(NULLIF($2, ''), mesa_atendimento) WHERE id = $1 RETURNING *`,
            [ticketId, mesa || null]
        );
        if (res.rows.length) {
            await this.atualizarPosicoesFila(db, res.rows[0].servico_id);
            const enriched = await db.query(
                `SELECT t.*, s.nome as servico_nome FROM tickets t JOIN servicos s ON s.id = t.servico_id WHERE t.id = $1`,
                [ticketId]
            );
            return enriched.rows[0] as ITicket & { servico_nome: string };
        }
        return null;
    }

    static async finalizarTicket(db: any, ticketId: string) {
        const res = await db.query(
            `UPDATE tickets SET status = 'finished', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [ticketId]
        );
        if (res.rows.length) {
            const enriched = await db.query(
                `SELECT t.*, s.nome as servico_nome FROM tickets t JOIN servicos s ON s.id = t.servico_id WHERE t.id = $1`,
                [ticketId]
            );
            return enriched.rows[0] as ITicket & { servico_nome: string };
        }
        return null;
    }

    static async buscarPorId(db: any, ticketId: string) {
        const res = await db.query(`SELECT * FROM tickets WHERE id = $1`, [ticketId]);
        return res.rows[0] || null;
    }

    static async transferirTicket(db: any, ticketId: string, mesa: string) {
        const res = await db.query(
            `UPDATE tickets SET mesa_atendimento = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [mesa, ticketId]
        );
        if (res.rows.length) {
            const enriched = await db.query(
                `SELECT t.*, s.nome as servico_nome FROM tickets t JOIN servicos s ON s.id = t.servico_id WHERE t.id = $1`,
                [ticketId]
            );
            return enriched.rows[0] as ITicket & { servico_nome: string };
        }
        return null;
    }

    static async buscarPorAlunoToken(db: any, alunoToken: string) {
        const res = await db.query(
            `SELECT t.*, s.nome as servico_nome, s.tempo_medio_atendimento
             FROM tickets t
             JOIN servicos s ON s.id = t.servico_id
             WHERE t.aluno_token = $1`,
            [alunoToken]
        );
        return res.rows[0] || null;
    }
}