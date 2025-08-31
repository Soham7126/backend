import { useState, useEffect, useCallback } from "react";

const useWebSocket = (url: string, onMessage: (data: any) => void) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log("WebSocket connected");
    };

    websocket.onmessage = (event) => {
      onMessage(event.data);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        connect();
      }, 5000);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url, onMessage]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup();
    };
  }, [connect]);

  return ws;
};

export default useWebSocket;
