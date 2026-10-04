import { io } from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  if (typeof window !== 'undefined') {
    // Connect directly through Vite / origin proxy or direct port
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

/**
 * Creates an isolated socket instance for a given role/page
 */
export const createSocketConnection = () => {
  const url = getSocketUrl();
  const socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  socket.on('connect_error', (err) => {
    // If proxy failed, try fallback directly to port 5000
    console.warn('Socket connection retry:', err.message);
  });

  return socket;
};
