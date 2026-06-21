import websocketPlugin from '@fastify/websocket';
import { logger } from '../src/shared/logger.js';
type WsLike = { send: (msg: string) => void; on?: any; once?: any };

const alunoTokenMap: Map<string, WsLike> = new Map();
const recepcionistasPorEscola: Map<string, Set<WsLike>> = new Map();
const recepcionistasGlobais: Set<WsLike> = new Set();
const monitoresPorEscola: Map<string, Set<WsLike>> = new Map();

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

        // Heartbeat ping every 30s
        const heartbeat = setInterval(() => {
            try { wsSend(ws, JSON.stringify({ type: 'heartbeat' })); } catch { safeClose(); }
        }, 30000);

        ws.on('message', (msg: Buffer | string) => {
            const text = typeof msg === 'string' ? msg : msg.toString();
            // Ignore heartbeat pong responses
            if (text === 'pong') return;
            try {
                const obj = JSON.parse(text);
                if (obj && obj.action === 'register') {
                    const { role, alunoToken, escolaId } = obj;

                    // Monitor/public display connections (no JWT needed)
                    if (role === 'monitor') {
                        registerConnection({ role, escolaId: escolaId || '1' }, ws);
                        try { ws.send(JSON.stringify({ ok: true, registered: { role, escolaId } })); } catch {}
                        return;
                    }

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
                    return;
                }
            } catch (e) {
                // ignorar payloads inválidos
            }
        });

        ws.on('close', () => { clearInterval(heartbeat); safeClose(); });
        ws.on('error', () => { clearInterval(heartbeat); safeClose(); });
    });

    // Periodic cleanup of stale connections every 60s
    setInterval(cleanClosedConnections, 60000);

    fastify.decorate('wsHelpers', {
        registerConnection,
        unregisterConnection,
        notificarFila,
        notificarAluno
    });
}

export function registerConnection(opts: { role: 'aluno' | 'recepcionista' | 'admin' | 'monitor'; escolaId?: string; alunoToken?: string }, ws: WsLike) {
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

    if (opts.role === 'monitor' && escolaKey) {
        let set = monitoresPorEscola.get(escolaKey);
        if (!set) {
            set = new Set();
            monitoresPorEscola.set(escolaKey, set);
        }
        set.add(ws);
    }
}

export function unregisterConnection(ws: WsLike) {
    for (const [token, w] of alunoTokenMap.entries()) {
        if (w === ws) alunoTokenMap.delete(token);
    }
    for (const set of recepcionistasPorEscola.values()) {
        if (set.has(ws)) set.delete(ws);
    }
    if (recepcionistasGlobais.has(ws)) recepcionistasGlobais.delete(ws);
    for (const set of monitoresPorEscola.values()) {
        if (set.has(ws)) set.delete(ws);
    }
}

function wsSend(ws: WsLike, msg: string): boolean {
    try {
        if (typeof (ws as any).readyState === 'number' && (ws as any).readyState !== 1 /* OPEN */) {
            return false;
        }
        ws.send(msg);
        return true;
    } catch (e) {
        return false;
    }
}

function cleanClosedConnections() {
    for (const [key, set] of recepcionistasPorEscola.entries()) {
        for (const ws of set) {
            if (typeof (ws as any).readyState === 'number' && (ws as any).readyState > 1) {
                set.delete(ws);
            }
        }
        if (set.size === 0) recepcionistasPorEscola.delete(key);
    }
    for (const ws of recepcionistasGlobais) {
        if (typeof (ws as any).readyState === 'number' && (ws as any).readyState > 1) {
            recepcionistasGlobais.delete(ws);
        }
    }
    for (const [token, ws] of alunoTokenMap.entries()) {
        if (typeof (ws as any).readyState === 'number' && (ws as any).readyState > 1) {
            alunoTokenMap.delete(token);
        }
    }
    for (const [key, set] of monitoresPorEscola.entries()) {
        for (const ws of set) {
            if (typeof (ws as any).readyState === 'number' && (ws as any).readyState > 1) {
                set.delete(ws);
            }
        }
        if (set.size === 0) monitoresPorEscola.delete(key);
    }
}

export function notificarFila(escolaId: string, evento: string, dados: any) {
    const escolaKey = String(escolaId);
    const set = recepcionistasPorEscola.get(escolaKey);
    const monitorSet = monitoresPorEscola.get(escolaKey);
    const msg = JSON.stringify({ evento, dados });
    let sent = false;
    if (set) {
        for (const ws of set) {
            if (wsSend(ws, msg)) sent = true;
        }
    }
    if (monitorSet) {
        for (const ws of monitorSet) {
            if (wsSend(ws, msg)) sent = true;
        }
    }
    for (const ws of recepcionistasGlobais) {
        if (wsSend(ws, msg)) sent = true;
    }
    if (!sent) {
        logger.warn(`notificarFila: no active WS connection for escolaId=${escolaId}, evento=${evento}`);
    }
}

export function notificarAluno(alunoToken: string, payload: any) {
    const ws = alunoTokenMap.get(alunoToken);
    if (!ws) return;
    if (!wsSend(ws, JSON.stringify(payload))) {
        logger.warn(`notificarAluno: failed to send to alunoToken=${alunoToken}, cleaning up`);
        alunoTokenMap.delete(alunoToken);
    }
}

/** Runs a WebSocket notification, swallowing/logging any failure so it never
 *  breaks the request flow. */
export function safeNotify(label: string, fn: () => void): void {
    try {
        fn();
    } catch {
        logger.warn(label);
    }
}
