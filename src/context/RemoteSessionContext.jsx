import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createSocketConnection } from '../utils/socket';

const RemoteSessionContext = createContext(null);

export const RemoteSessionProvider = ({ children }) => {
  const location = useLocation();
  const isRemoteRoute = location.pathname.startsWith('/remote/');

  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('anime_remote_session_id') || '';
  });
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const commandListenersRef = useRef(new Set());
  const socketRef = useRef(null);

  // Initialize socket on mount (only for laptop website, not for remote controller page)
  useEffect(() => {
    if (isRemoteRoute) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsSocketConnected(true);
      const curId = localStorage.getItem('anime_remote_session_id') || sessionId;
      socket.emit('register-laptop', { sessionId: curId });
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
      setIsRemoteConnected(false);
    };

    const handleLaptopRegistered = ({ sessionId: confirmedId }) => {
      setSessionId(confirmedId);
      localStorage.setItem('anime_remote_session_id', confirmedId);
    };

    const handleRemoteConnected = () => {
      setIsRemoteConnected(true);
    };

    const handleRemoteDisconnected = () => {
      setIsRemoteConnected(false);
    };

    const handleRemoteCommand = (command) => {
      commandListenersRef.current.forEach(listener => {
        try {
          listener(command);
        } catch (e) {
          console.error('Error executing remote command listener:', e);
        }
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('laptop-registered', handleLaptopRegistered);
    socket.on('remote-connected', handleRemoteConnected);
    socket.on('remote-disconnected', handleRemoteDisconnected);
    socket.on('remote-command', handleRemoteCommand);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('laptop-registered', handleLaptopRegistered);
      socket.off('remote-connected', handleRemoteConnected);
      socket.off('remote-disconnected', handleRemoteDisconnected);
      socket.off('remote-command', handleRemoteCommand);
      socket.disconnect();
    };
  }, [isRemoteRoute]);

  // Broadcast player state to phone via server
  const broadcastPlayerState = useCallback((state) => {
    if (socketRef.current && socketRef.current.connected && sessionId) {
      socketRef.current.emit('player-state', {
        sessionId,
        state
      });
    }
  }, [sessionId]);

  // Subscribe to remote commands
  const registerCommandListener = useCallback((callback) => {
    commandListenersRef.current.add(callback);
    return () => {
      commandListenersRef.current.delete(callback);
    };
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <RemoteSessionContext.Provider
      value={{
        sessionId,
        isRemoteConnected,
        isSocketConnected,
        isModalOpen,
        openModal,
        closeModal,
        broadcastPlayerState,
        registerCommandListener
      }}
    >
      {children}
    </RemoteSessionContext.Provider>
  );
};

export const useRemoteSession = () => {
  const context = useContext(RemoteSessionContext);
  if (!context) {
    throw new Error('useRemoteSession must be used within a RemoteSessionProvider');
  }
  return context;
};
