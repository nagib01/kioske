import websocketPlugin from '@fastify/websocket';
import { logger } from '../src/shared/logger.js';
type WsLike = { send: (msg: string) => void; on?: any; once?: any };

const alunoTokenMap: Map<string, WsLike> = new Map();
const recepcionistasPorEscola: Map<string, Set<WsLike>> = new Map();
const recepcionistasGlobais: Set<WsLike> = new Set();

function verifyToken(fastify: any, token: string): { role: string; escola_id?: string } | null {
    try {
        const payload = fastify.jwt.verify(token);
        return { role: payload.role, escola_id: String(payload.escola_id) };
    } catch {
        return null;
    }
}

export async function configureWebSocket(fastify: any) {
    await fastify.register(websocketPlugin as any);

    fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
        const ws: WsLike = connection.socket || connection;

        const safeClose = () => {
            try { unregisterConnection(ws); } catch (e) { logger.error('unregisterConnection failed', e); }
        };

        ws.on('message', (msg: Buffer | string) => {
            const text = typeof msg === 'string' ? msg : msg.toString();
            try {
                const obj = JSON.parse(text);
                if (obj && obj.action === 'register') {
                    const { role, alunoToken } = obj;

                    // Backoffice connections require JWT verification
                    if (role === 'recepcionista' || role === 'admin') {
                        const token = obj.token || obj.backofficeToken;
                        if (!token) {
                            try { ws.send(JSON.stringify({ error: 'Token required for backoffice connections', code: 'UNAUTHORIZED' })); } catch {}
                            return;
                        }
                        const decoded = verifyToken(fastify, token);
                        if (!decoded || decoded.role !== role) {
                            try { ws.send(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' })); } catch {}
                            return;
                        }
                        registerConnection({ role, escolaId: decoded.escola_id, alunoToken }, ws);
                        try { ws.send(JSON.stringify({ ok: true, registered: { role, escolaId: decoded.escola_id } })); } catch {}
                        return;
                    }

                    // Aluno connections use alunoToken as identifier (no JWT needed)
                    registerConnection({ role, alunoToken }, ws);
                    try { ws.send(JSON.stringify({ ok: true, registered: { role, alunoToken } })); } catch {}
                }
            } catch (e) {
                // ignorar payloads inválidos
            }
        });

        ws.on('close', () => safeClose());
        ws.on('error', () => safeClose());
    });

    fastify.decorate('wsHelpers', {
        registerConnection,
        unregisterConnection,
        notificarFila,
        notificarAluno
    });
}

export function registerConnection(opts: { role: 'aluno' | 'recepcionista' | 'admin'; escolaId?: string; alunoToken?: string }, ws: WsLike) {
    if (opts.role === 'aluno' && opts.alunoToken) {
        // substitui ligação anterior se existir (cliente reconectou)
        alunoTokenMap.set(opts.alunoToken, ws);
    }
    const escolaKey = opts.escolaId ? String(opts.escolaId) : undefined;
    if ((opts.role === 'recepcionista' || opts.role === 'admin') && escolaKey) {
        let set = recepcionistasPorEscola.get(escolaKey);
        if (!set) {
            set = new Set();
            recepcionistasPorEscola.set(escolaKey, set);
        }
        set.add(ws);
    }
    if ((opts.role === 'recepcionista' || opts.role === 'admin') && !escolaKey) {
        recepcionistasGlobais.add(ws);
    }
}

export function unregisterConnection(ws: WsLike) {
    // limpar mapas
    for (const [token, w] of alunoTokenMap.entries()) {
        if (w === ws) alunoTokenMap.delete(token);
    }
    for (const set of recepcionistasPorEscola.values()) {
        if (set.has(ws)) set.delete(ws);
    }
    if (recepcionistasGlobais.has(ws)) recepcionistasGlobais.delete(ws);
}

export function notificarFila(escolaId: string, evento: string, dados: any) {
    const set = recepcionistasPorEscola.get(String(escolaId));
    const msg = JSON.stringify({ evento, dados });
    if (set) {
        set.forEach(ws => { try { ws.send(msg); } catch (e) { logger.error('WS send error (recepcionista)', e); } });
    }
    recepcionistasGlobais.forEach(ws => { try { ws.send(msg); } catch (e) { logger.error('WS send error (global)', e); } });
}

export function notificarAluno(alunoToken: string, payload: any) {
    const ws = alunoTokenMap.get(alunoToken);
    if (!ws) return;
    try { ws.send(JSON.stringify(payload)); } catch (e) { logger.error('WS send error (aluno)', e); }
}
