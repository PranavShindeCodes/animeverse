import { io } from 'socket.io-client';

const DEFAULT_BACKEND_URL = 'https://anime-backend-2-hhen.onrender.com';

export const getSocketUrl = () => {
  const url = import.meta.env.VITE_SOCKET_URL || DEFAULT_BACKEND_URL;
  return url.replace(/\/$/, '');
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
    timeout: 20000
  });

  socket.on('connect_error', (err) => {
    // If proxy failed, try fallback directly to port 5000
    console.warn('Socket connection retry:', err.message);
  });

  return socket;
};
