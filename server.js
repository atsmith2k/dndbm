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
const userPresence = new Map(); // userId -> { sessionId, socketId, cursor, lastActivity }

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

  // Helper function to get user role in session
  async function getUserRole(sessionId, userId) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const participant = await prisma.sessionParticipant.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId
          }
        }
      });

      await prisma.$disconnect();
      return participant?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Helper function to check permissions
  function hasPermission(role, permission) {
    const ROLE_PERMISSIONS = {
      DM: {
        canEditMap: true,
        canMoveAnyEntity: true,
        canManageParticipants: true,
        canControlSession: true,
        canModifyTerrain: true
      },
      PLAYER: {
        canEditMap: false,
        canMoveAnyEntity: false,
        canManageParticipants: false,
        canControlSession: false,
        canModifyTerrain: false,
        canMoveAssignedCharacter: true
      }
    };

    return ROLE_PERMISSIONS[role]?.[permission] === true;
  }

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session with enhanced presence tracking
    socket.on('join-session', async (sessionId, userId, displayName) => {
      socket.join(sessionId);

      // Store user presence
      userPresence.set(userId, {
        sessionId,
        socketId: socket.id,
        displayName: displayName || 'Anonymous',
        cursor: null,
        lastActivity: new Date(),
        isConnected: true
      });

      // Get user role
      const role = await getUserRole(sessionId, userId);

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          id: sessionId,
          participants: [],
          currentTurn: 0,
          round: 1
        });
      }

      const session = sessions.get(sessionId);
      if (!session.participants.find(p => p.userId === userId)) {
        session.participants.push({
          userId,
          displayName: displayName || 'Anonymous',
          role: role || 'PLAYER',
          isConnected: true,
          socketId: socket.id
        });
      }

      // Notify others of user joining
      socket.to(sessionId).emit('user-joined', {
        userId,
        displayName: displayName || 'Anonymous',
        role: role || 'PLAYER',
        isConnected: true
      });

      // Send current session state to joining user
      socket.emit('session-state', {
        session,
        connectedUsers: session.participants.filter(p => p.isConnected)
      });

      console.log(`User ${userId} (${role}) joined session ${sessionId}`);
    });

    // Leave session with presence cleanup
    socket.on('leave-session', (sessionId, userId) => {
      socket.leave(sessionId);

      // Update user presence
      if (userPresence.has(userId)) {
        const presence = userPresence.get(userId);
        presence.isConnected = false;
        presence.lastActivity = new Date();
      }

      const session = sessions.get(sessionId);
      if (session) {
        const participant = session.participants.find(p => p.userId === userId);
        if (participant) {
          participant.isConnected = false;
        }
      }

      socket.to(sessionId).emit('user-left', userId);
      console.log(`User ${userId} left session ${sessionId}`);
    });

    // Cursor movement tracking
    socket.on('cursor-move', (sessionId, userId, position) => {
      if (userPresence.has(userId)) {
        const presence = userPresence.get(userId);
        presence.cursor = position;
        presence.lastActivity = new Date();
      }

      socket.to(sessionId).emit('cursor-moved', userId, position);
    });

    // Map updates with permission checking
    socket.on('map-update', async (sessionId, mapData, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canEditMap')) {
        socket.emit('permission-denied', 'map-update', 'Insufficient permissions');
        return;
      }

      socket.to(sessionId).emit('map-updated', mapData, userId);
    });

    // Entity movement with permission checking
    socket.on('entity-move', async (sessionId, entityId, position, userId) => {
      const role = await getUserRole(sessionId, userId);

      // Check if user can move this entity
      if (!hasPermission(role, 'canMoveAnyEntity')) {
        // For players, check if it's their assigned character
        // This would need additional logic to check entity ownership
        socket.emit('permission-denied', 'entity-move', 'Cannot move this entity');
        return;
      }

      socket.to(sessionId).emit('entity-moved', entityId, position, userId);
    });

    // Entity updates with permission checking
    socket.on('entity-update', async (sessionId, entity, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canEditMap')) {
        socket.emit('permission-denied', 'entity-update', 'Insufficient permissions');
        return;
      }

      socket.to(sessionId).emit('entity-updated', entity, userId);
    });

    // Terrain updates with permission checking
    socket.on('terrain-update', async (sessionId, terrain, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canModifyTerrain')) {
        socket.emit('permission-denied', 'terrain-update', 'Insufficient permissions');
        return;
      }

      socket.to(sessionId).emit('terrain-updated', terrain, userId);
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

    // Role management (DM only)
    socket.on('update-role', async (sessionId, targetUserId, newRole, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canManageParticipants')) {
        socket.emit('permission-denied', 'update-role', 'Insufficient permissions');
        return;
      }

      // Update role in session data
      const session = sessions.get(sessionId);
      if (session) {
        const participant = session.participants.find(p => p.userId === targetUserId);
        if (participant) {
          participant.role = newRole;
        }
      }

      io.to(sessionId).emit('role-updated', targetUserId, newRole, userId);
    });

    // Character assignment (DM only)
    socket.on('assign-character', async (sessionId, targetUserId, characterId, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canManageParticipants')) {
        socket.emit('permission-denied', 'assign-character', 'Insufficient permissions');
        return;
      }

      io.to(sessionId).emit('character-assigned', targetUserId, characterId, userId);
    });

    // Kick participant (DM only)
    socket.on('kick-participant', async (sessionId, targetUserId, userId) => {
      const role = await getUserRole(sessionId, userId);

      if (!hasPermission(role, 'canManageParticipants')) {
        socket.emit('permission-denied', 'kick-participant', 'Insufficient permissions');
        return;
      }

      // Remove from session
      const session = sessions.get(sessionId);
      if (session) {
        session.participants = session.participants.filter(p => p.userId !== targetUserId);
      }

      // Remove from presence
      userPresence.delete(targetUserId);

      // Find target socket and disconnect
      const targetPresence = Array.from(userPresence.values()).find(p => p.userId === targetUserId);
      if (targetPresence) {
        const targetSocket = io.sockets.sockets.get(targetPresence.socketId);
        if (targetSocket) {
          targetSocket.leave(sessionId);
          targetSocket.emit('kicked-from-session', sessionId, userId);
        }
      }

      io.to(sessionId).emit('participant-kicked', targetUserId, userId);
    });

    // Disconnect with cleanup
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Find and update user presence
      for (const [userId, presence] of userPresence.entries()) {
        if (presence.socketId === socket.id) {
          presence.isConnected = false;
          presence.lastActivity = new Date();

          // Update session participants
          const session = sessions.get(presence.sessionId);
          if (session) {
            const participant = session.participants.find(p => p.userId === userId);
            if (participant) {
              participant.isConnected = false;
            }

            // Notify others of disconnection
            socket.to(presence.sessionId).emit('user-disconnected', userId);
          }
          break;
        }
      }
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
