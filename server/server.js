import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const allowedOrigins = [
  'https://animeversee-chi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for Socket.IO origin: ' + origin));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory active sessions Map
// Key: sessionId (string) -> Value: { sessionId, laptopSocketId, phoneSocketId, lastState, createdAt, lastActive, deleteTimeout }
const sessions = new Map();

// Map socketId -> { type: 'laptop' | 'phone', sessionId }
const socketLookup = new Map();

// Allowed remote actions
const ALLOWED_ACTIONS = new Set([
  'PLAY',
  'PAUSE',
  'TOGGLE_PLAY',
  'PREVIOUS_EPISODE',
  'NEXT_EPISODE',
  'SEEK',
  'SET_VOLUME',
  'TOGGLE_MUTE',
  'SELECT_EPISODE',
  'FULLSCREEN',
  'NAV_UP',
  'NAV_DOWN',
  'NAV_LEFT',
  'NAV_RIGHT',
  'NAV_OK',
  'NAV_BACK',
  'NAV_HOME'
]);

// Helper: Generate random 6-character alphanumeric session code (e.g. A7K92P)
export function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous chars
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AnimeVerse Remote Control Server',
    status: 'online',
    activeSessions: sessions.size,
    timestamp: Date.now()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: Date.now()
  });
});

io.on('connection', (socket) => {
  // 1. LAPTOP REGISTRATION
  socket.on('register-laptop', ({ sessionId: requestedId } = {}) => {
    let sessionId = requestedId ? requestedId.trim().toUpperCase() : '';

    let session = null;

    if (sessionId && sessions.has(sessionId)) {
      // Reclaiming existing session ID (e.g. after refresh/reconnect)
      session = sessions.get(sessionId);
      if (session.deleteTimeout) {
        clearTimeout(session.deleteTimeout);
        session.deleteTimeout = null;
      }
      session.laptopSocketId = socket.id;
      session.lastActive = Date.now();
    } else {
      if (!sessionId) {
        do {
          sessionId = generateSessionId();
        } while (sessions.has(sessionId));
      }

      session = {
        sessionId,
        laptopSocketId: socket.id,
        phoneSocketId: null,
        lastState: null,
        createdAt: Date.now(),
        lastActive: Date.now(),
        deleteTimeout: null
      };
      sessions.set(sessionId, session);
    }

    socketLookup.set(socket.id, { type: 'laptop', sessionId });
    socket.join(`session:${sessionId}`);

    socket.emit('laptop-registered', { sessionId });

    // If phone was already waiting or connected, notify both
    if (session.phoneSocketId) {
      const phoneSocket = io.sockets.sockets.get(session.phoneSocketId);
      if (phoneSocket && phoneSocket.connected) {
        socket.emit('remote-connected', { phoneId: session.phoneSocketId });
        phoneSocket.emit('laptop-connected');
        if (session.lastState) {
          phoneSocket.emit('player-state', session.lastState);
        }
      } else {
        session.phoneSocketId = null;
      }
    }
  });

  // 2. PHONE / REMOTE REGISTRATION
  socket.on('register-remote', ({ sessionId: inputId } = {}) => {
    if (!inputId) {
      return socket.emit('error-invalid-session', { message: 'No session ID provided.' });
    }

    const sessionId = inputId.trim().toUpperCase();
    const session = sessions.get(sessionId);

    if (!session) {
      return socket.emit('error-invalid-session', { 
        message: 'This remote session is invalid or expired.' 
      });
    }

    // Check if another phone is already actively connected
    if (session.phoneSocketId && session.phoneSocketId !== socket.id) {
      const existingPhoneSocket = io.sockets.sockets.get(session.phoneSocketId);
      if (existingPhoneSocket && existingPhoneSocket.connected) {
        return socket.emit('error-session-busy', { 
          message: 'This session already has a remote connected.' 
        });
      }
    }

    // Register phone to session
    session.phoneSocketId = socket.id;
    session.lastActive = Date.now();
    socketLookup.set(socket.id, { type: 'phone', sessionId });

    socket.join(`session:${sessionId}`);

    // Confirm to phone
    socket.emit('remote-registered', {
      sessionId,
      lastState: session.lastState
    });

    // Notify laptop that remote has connected
    if (session.laptopSocketId) {
      io.to(session.laptopSocketId).emit('remote-connected', {
        phoneId: socket.id
      });
      // Request fresh state from laptop
      io.to(session.laptopSocketId).emit('request-player-state');
    }
  });

  // 3. LAPTOP SENDS CURRENT PLAYER STATE
  socket.on('player-state', ({ sessionId, state } = {}) => {
    if (!sessionId || !state) return;
    const session = sessions.get(sessionId);
    if (!session) return;

    session.lastState = state;
    session.lastActive = Date.now();

    if (session.phoneSocketId) {
      io.to(session.phoneSocketId).emit('player-state', state);
    }
  });

  // 4. PHONE SENDS REMOTE COMMAND
  socket.on('remote-command', ({ sessionId, command } = {}) => {
    if (!sessionId || !command || !command.action) return;

    if (!ALLOWED_ACTIONS.has(command.action)) {
      console.warn(`Blocked unauthorized action: ${command.action}`);
      return;
    }

    const session = sessions.get(sessionId);
    if (!session || !session.laptopSocketId) {
      return socket.emit('laptop-disconnected');
    }

    session.lastActive = Date.now();

    // Forward command directly to laptop
    io.to(session.laptopSocketId).emit('remote-command', command);
  });

  // 5. PHONE ASKS FOR STATE
  socket.on('request-player-state', ({ sessionId } = {}) => {
    if (!sessionId) return;
    const session = sessions.get(sessionId);
    if (session) {
      if (session.laptopSocketId) {
        io.to(session.laptopSocketId).emit('request-player-state');
      }
      if (session.lastState) {
        socket.emit('player-state', session.lastState);
      }
    }
  });

  // 6. DISCONNECT HANDLING
  socket.on('disconnect', () => {
    const lookup = socketLookup.get(socket.id);
    if (!lookup) return;

    const { type, sessionId } = lookup;
    socketLookup.delete(socket.id);

    const session = sessions.get(sessionId);
    if (!session) return;

    if (type === 'laptop') {
      if (session.laptopSocketId === socket.id) {
        // Laptop disconnected -> notify phone
        if (session.phoneSocketId) {
          io.to(session.phoneSocketId).emit('laptop-disconnected');
        }
        // Grace period before deleting session (60s) to allow laptop refresh/reconnect
        if (session.deleteTimeout) clearTimeout(session.deleteTimeout);
        session.deleteTimeout = setTimeout(() => {
          if (sessions.get(sessionId)?.laptopSocketId === socket.id) {
            sessions.delete(sessionId);
          }
        }, 60 * 1000);
      }
    } else if (type === 'phone') {
      if (session.phoneSocketId === socket.id) {
        session.phoneSocketId = null;
        if (session.laptopSocketId) {
          io.to(session.laptopSocketId).emit('remote-disconnected');
        }
      }
    }
  });
});

// Periodic session cleanup (every 10 minutes, remove sessions inactive for > 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActive > 2 * 60 * 60 * 1000) {
      if (session.deleteTimeout) clearTimeout(session.deleteTimeout);
      sessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`⚡ Anime Remote Server running on http://${HOST}:${PORT}`);
});
