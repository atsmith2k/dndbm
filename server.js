const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active sessions and their data
const sessions = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"]
    }
  });

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session
    socket.on('join-session', (sessionId, userId) => {
      socket.join(sessionId);
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          id: sessionId,
          participants: [],
          currentTurn: 0,
          round: 1
        });
      }
      
      const session = sessions.get(sessionId);
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
      }

      socket.to(sessionId).emit('user-joined', userId);
      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Leave session
    socket.on('leave-session', (sessionId, userId) => {
      socket.leave(sessionId);
      
      const session = sessions.get(sessionId);
      if (session) {
        session.participants = session.participants.filter(id => id !== userId);
      }

      socket.to(sessionId).emit('user-left', userId);
    });

    // Map updates
    socket.on('map-update', (sessionId, mapData) => {
      socket.to(sessionId).emit('map-updated', mapData);
    });

    // Entity movement
    socket.on('entity-move', (sessionId, entityId, position) => {
      socket.to(sessionId).emit('entity-moved', entityId, position);
    });

    // Entity updates
    socket.on('entity-update', (sessionId, entity) => {
      socket.to(sessionId).emit('entity-updated', entity);
    });

    // Initiative updates
    socket.on('initiative-update', (sessionId, initiative) => {
      socket.to(sessionId).emit('initiative-updated', initiative);
    });

    // Turn management
    socket.on('next-turn', (sessionId) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.currentTurn = (session.currentTurn + 1) % Math.max(session.participants.length, 1);
        if (session.currentTurn === 0) {
          session.round += 1;
        }
        io.to(sessionId).emit('turn-changed', session.currentTurn, session.round);
      }
    });

    // Chat messages
    socket.on('chat-message', (sessionId, message) => {
      io.to(sessionId).emit('chat-message', message);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
