import { useState, useEffect, useRef, useCallback } from 'react';

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSED = 'closed',
  ERROR = 'error',
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (url: string, onMessage?: (message: WebSocketMessage) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CLOSED);
  const [sessionCount, setSessionCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    setStatus(ConnectionStatus.CONNECTING);
    
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log(`[WS] Connected to ${url}`);
        setStatus(ConnectionStatus.OPEN);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (onMessage) onMessage(message);
          if (message.type === 'NEW_INCIDENT') {
            setSessionCount(prev => prev + 1);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.current.onclose = () => {
        console.log('[WS] Connection closed');
        setStatus(ConnectionStatus.CLOSED);
        // Auto-reconnect after 5 seconds
        reconnectTimeout.current = window.setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.current.onerror = (err) => {
        console.error('[WS] WebSocket error:', err);
        setStatus(ConnectionStatus.ERROR);
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setStatus(ConnectionStatus.ERROR);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  const sendMessage = (type: string, data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
    }
  };

  return { status, sessionCount, sendMessage };
};
