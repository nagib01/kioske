import { useState } from 'react';
import { useWebSocket } from './useWebSocket';

export interface QueueData {
  token?: string;
  posicao_fila?: number;
  estado?: string;
}

export function useRealtimeQueue(token: string | null) {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useWebSocket({
    enabled: !!token,
    reconnectKey: token || '',
    register: () => ({ action: 'register', role: 'aluno', alunoToken: token }),
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
    onMessage: (msg) => {
      if (msg.event === 'estado_inicial' || msg.event === 'queue_update') {
        setQueueData(msg.data as QueueData);
      }
      if (msg.event === 'chamado') {
        setQueueData((prev) => ({ ...prev, estado: 'called' }));
      }
    },
  });

  return { queueData, isConnected };
}
