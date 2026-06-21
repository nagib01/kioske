import { useEffect, useRef } from 'react';
import { WS_URL } from '../lib/api';

type WsMessage = { event?: string; data?: unknown; [key: string]: unknown };

interface UseWebSocketOptions {
  enabled?: boolean;
  path?: string;
  /** Re-connects when this key changes (e.g. the auth token or escola id). */
  reconnectKey?: string;
  /** Payload sent on open; return null to send nothing. */
  register?: () => Record<string, unknown> | null;
  onMessage?: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectMs?: number;
}

/**
 * Reconnecting WebSocket hook shared by the kiosk/monitor/backoffice realtime
 * features. Consolidates the previously duplicated connect/register/reconnect
 * logic (see REFACTOR_PLAN).
 */
export function useWebSocket({
  enabled = true,
  path = '/ws',
  reconnectKey = '',
  register,
  onMessage,
  onOpen,
  onClose,
  reconnectMs = 3000,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const cbRef = useRef({ register, onMessage, onOpen, onClose });
  cbRef.current = { register, onMessage, onOpen, onClose };

  useEffect(() => {
    if (!enabled) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let closedByUs = false;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}${path}`);
      wsRef.current = ws;

      ws.onopen = () => {
        const payload = cbRef.current.register?.();
        if (payload) ws.send(JSON.stringify(payload));
        cbRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          cbRef.current.onMessage?.(JSON.parse(event.data));
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = () => {
        cbRef.current.onClose?.();
        if (!closedByUs) reconnectTimeout = setTimeout(connect, reconnectMs);
      };

      ws.onerror = () => {
        /* close handler drives reconnect */
      };
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, path, reconnectKey, reconnectMs]);

  return wsRef;
}
