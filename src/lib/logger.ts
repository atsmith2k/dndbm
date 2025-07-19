/**
 * Simple logger utility that respects environment configuration
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const debugEnabled = process.env.DEBUG_LOGGING === 'true' || isDevelopment;

export const logger = {
  debug: (...args: any[]) => {
    if (debugEnabled) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (debugEnabled) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  
  // Socket-specific logging
  socket: {
    connect: (socketId: string) => {
      if (debugEnabled) {
        console.log('[SOCKET] Client connected:', socketId);
      }
    },
    
    disconnect: (socketId: string) => {
      if (debugEnabled) {
        console.log('[SOCKET] Client disconnected:', socketId);
      }
    },
    
    userJoined: (userId: string, sessionId: string, role?: string) => {
      if (debugEnabled) {
        console.log(`[SOCKET] User ${userId} (${role}) joined session ${sessionId}`);
      }
    },
    
    userLeft: (userId: string, sessionId: string) => {
      if (debugEnabled) {
        console.log(`[SOCKET] User ${userId} left session ${sessionId}`);
      }
    },
    
    reconnect: (attemptNumber: number) => {
      if (debugEnabled) {
        console.log('[SOCKET] Reconnected after', attemptNumber, 'attempts');
      }
    },
    
    reconnectFailed: () => {
      if (debugEnabled) {
        console.log('[SOCKET] Failed to reconnect after maximum attempts');
      }
    }
  }
};
