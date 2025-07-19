import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Global variable to store the Socket.io server instance
let io: SocketIOServer | undefined;

// Store active sessions and their data (in production, use Redis or similar)
const sessions = new Map();
const userPresence = new Map();

// Helper function to get user role in session
async function getUserRole(sessionId: string, userId: string) {
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
function hasPermission(role: string, permission: string) {
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
  
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.[permission as keyof typeof ROLE_PERMISSIONS.DM] === true;
}

function initializeSocketIO(server: NetServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || false
        : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

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
      if (!session.participants.find((p: any) => p.userId === userId)) {
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
        connectedUsers: session.participants.filter((p: any) => p.isConnected)
      });

      console.log(`User ${userId} (${role}) joined session ${sessionId}`);
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
      
      if (!hasPermission(role, 'canMoveAnyEntity')) {
        socket.emit('permission-denied', 'entity-move', 'Cannot move this entity');
        return;
      }
      
      socket.to(sessionId).emit('entity-moved', entityId, position, userId);
    });

    // Leave session with presence cleanup
    socket.on('leave-session', (sessionId, userId) => {
      socket.leave(sessionId);
      
      if (userPresence.has(userId)) {
        const presence = userPresence.get(userId);
        presence.isConnected = false;
        presence.lastActivity = new Date();
      }
      
      const session = sessions.get(sessionId);
      if (session) {
        const participant = session.participants.find((p: any) => p.userId === userId);
        if (participant) {
          participant.isConnected = false;
        }
      }

      socket.to(sessionId).emit('user-left', userId);
      console.log(`User ${userId} left session ${sessionId}`);
    });

    // Disconnect with cleanup
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      for (const [userId, presence] of userPresence.entries()) {
        if (presence.socketId === socket.id) {
          presence.isConnected = false;
          presence.lastActivity = new Date();
          
          const session = sessions.get(presence.sessionId);
          if (session) {
            const participant = session.participants.find((p: any) => p.userId === userId);
            if (participant) {
              participant.isConnected = false;
            }
            
            socket.to(presence.sessionId).emit('user-disconnected', userId);
          }
          break;
        }
      }
    });
  });

  return io;
}

export async function GET(req: NextRequest) {
  // This endpoint is used to initialize the Socket.io server
  // In Vercel, we need to use a different approach for WebSockets
  return new Response('Socket.io server endpoint', { status: 200 });
}

export async function POST(req: NextRequest) {
  // Handle Socket.io initialization if needed
  return new Response('Socket.io initialized', { status: 200 });
}
