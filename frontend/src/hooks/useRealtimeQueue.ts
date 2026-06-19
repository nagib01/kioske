import { useEffect, useRef, useState } from 'react';

export interface QueueData {
  token?: string;
  posicao_fila?: number;
  estado?: string;
}

export function useRealtimeQueue(token: string | null) {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    let reconnectTimeout: NodeJS.Timeout;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ action: 'register', role: 'aluno', alunoToken: token }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.event === 'estado_inicial' || msg.event === 'queue_update') {
          setQueueData(msg.data);
        }
        if (msg.event === 'chamado') {
          setQueueData((prev) => ({ ...prev, estado: 'called' }));
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error', err);
      };
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, [token]);

  return { queueData, isConnected };
}