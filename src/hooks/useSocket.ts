import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BattleMapData, MapEntity, Position } from '@/types/battle-map';
import { UserPresence, SessionData, Role, ChatMessage } from '@/types/session';
import { logger } from '@/lib/logger';

interface UseSocketProps {
  sessionId: string;
  userId: string;
  displayName?: string;
  onMapUpdate?: (mapData: BattleMapData, updatedBy: string) => void;
  onEntityMove?: (entityId: string, position: Position, movedBy: string) => void;
  onEntityUpdate?: (entity: MapEntity, updatedBy: string) => void;
  onTerrainUpdate?: (terrain: any[], updatedBy: string) => void;
  onTurnChange?: (currentTurn: number, round: number) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onUserJoined?: (user: UserPresence) => void;
  onUserLeft?: (userId: string) => void;
  onUserDisconnected?: (userId: string) => void;
  onCursorMoved?: (userId: string, position: Position) => void;
  onRoleUpdated?: (userId: string, newRole: Role, updatedBy: string) => void;
  onCharacterAssigned?: (userId: string, characterId: string, assignedBy: string) => void;
  onParticipantKicked?: (userId: string, kickedBy: string) => void;
  onPermissionDenied?: (action: string, reason: string) => void;
  onSessionState?: (state: any) => void;
  onKickedFromSession?: (sessionId: string, kickedBy: string) => void;
}

export function useSocket({
  sessionId,
  userId,
  displayName,
  onMapUpdate,
  onEntityMove,
  onEntityUpdate,
  onTerrainUpdate,
  onTurnChange,
  onChatMessage,
  onUserJoined,
  onUserLeft,
  onUserDisconnected,
  onCursorMoved,
  onRoleUpdated,
  onCharacterAssigned,
  onParticipantKicked,
  onPermissionDenied,
  onSessionState,
  onKickedFromSession
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Initialize socket connection
    const socketUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      : 'http://localhost:3000';

    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: process.env.NODE_ENV === 'production'
        ? ['polling'] // Use polling for Vercel compatibility
        : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      logger.socket.connect(socket.id || 'unknown');
      setIsConnected(true);
      setReconnectAttempts(0);

      // Join session with display name
      socket.emit('join-session', sessionId, userId, displayName);
    });

    socket.on('disconnect', () => {
      logger.socket.disconnect(socket.id || 'unknown');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      logger.socket.reconnect(attemptNumber);
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      logger.debug('Reconnection attempt', attemptNumber);
      setReconnectAttempts(attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      logger.socket.reconnectFailed();
      setIsConnected(false);
    });

    // Set up event listeners
    if (onMapUpdate) socket.on('map-updated', onMapUpdate);
    if (onEntityMove) socket.on('entity-moved', onEntityMove);
    if (onEntityUpdate) socket.on('entity-updated', onEntityUpdate);
    if (onTerrainUpdate) socket.on('terrain-updated', onTerrainUpdate);
    if (onTurnChange) socket.on('turn-changed', onTurnChange);
    if (onChatMessage) socket.on('chat-message', onChatMessage);
    if (onUserJoined) socket.on('user-joined', onUserJoined);
    if (onUserLeft) socket.on('user-left', onUserLeft);
    if (onUserDisconnected) socket.on('user-disconnected', onUserDisconnected);
    if (onCursorMoved) socket.on('cursor-moved', onCursorMoved);
    if (onRoleUpdated) socket.on('role-updated', onRoleUpdated);
    if (onCharacterAssigned) socket.on('character-assigned', onCharacterAssigned);
    if (onParticipantKicked) socket.on('participant-kicked', onParticipantKicked);
    if (onPermissionDenied) socket.on('permission-denied', onPermissionDenied);
    if (onSessionState) socket.on('session-state', onSessionState);
    if (onKickedFromSession) socket.on('kicked-from-session', onKickedFromSession);

  }, [sessionId, userId, displayName, onMapUpdate, onEntityMove, onEntityUpdate, onTerrainUpdate, onTurnChange, onChatMessage, onUserJoined, onUserLeft, onUserDisconnected, onCursorMoved, onRoleUpdated, onCharacterAssigned, onParticipantKicked, onPermissionDenied, onSessionState, onKickedFromSession]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-session', sessionId, userId);
        socketRef.current.disconnect();
      }
    };
  }, [connect, sessionId, userId]);

  // Emit functions with user context
  const emitMapUpdate = useCallback((mapData: BattleMapData) => {
    socketRef.current?.emit('map-update', sessionId, mapData, userId);
  }, [sessionId, userId]);

  const emitEntityMove = useCallback((entityId: string, position: Position) => {
    socketRef.current?.emit('entity-move', sessionId, entityId, position, userId);
  }, [sessionId, userId]);

  const emitEntityUpdate = useCallback((entity: MapEntity) => {
    socketRef.current?.emit('entity-update', sessionId, entity, userId);
  }, [sessionId, userId]);

  const emitTerrainUpdate = useCallback((terrain: any[]) => {
    socketRef.current?.emit('terrain-update', sessionId, terrain, userId);
  }, [sessionId, userId]);

  const emitCursorMove = useCallback((position: Position) => {
    socketRef.current?.emit('cursor-move', sessionId, userId, position);
  }, [sessionId, userId]);

  const emitNextTurn = useCallback(() => {
    socketRef.current?.emit('next-turn', sessionId);
  }, [sessionId]);

  const emitChatMessage = useCallback((message: ChatMessage) => {
    socketRef.current?.emit('chat-message', sessionId, message);
  }, [sessionId]);

  const emitInitiativeUpdate = useCallback((initiative: any[]) => {
    socketRef.current?.emit('initiative-update', sessionId, initiative);
  }, [sessionId]);

  // Role management functions (DM only)
  const emitUpdateRole = useCallback((targetUserId: string, newRole: Role) => {
    socketRef.current?.emit('update-role', sessionId, targetUserId, newRole, userId);
  }, [sessionId, userId]);

  const emitAssignCharacter = useCallback((targetUserId: string, characterId: string) => {
    socketRef.current?.emit('assign-character', sessionId, targetUserId, characterId, userId);
  }, [sessionId, userId]);

  const emitKickParticipant = useCallback((targetUserId: string) => {
    socketRef.current?.emit('kick-participant', sessionId, targetUserId, userId);
  }, [sessionId, userId]);

  // Connection management
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    connect();
  }, [connect]);

  return {
    // Connection state
    isConnected,
    reconnectAttempts,

    // Map and entity actions
    emitMapUpdate,
    emitEntityMove,
    emitEntityUpdate,
    emitTerrainUpdate,
    emitCursorMove,

    // Session actions
    emitNextTurn,
    emitChatMessage,
    emitInitiativeUpdate,

    // Role management (DM only)
    emitUpdateRole,
    emitAssignCharacter,
    emitKickParticipant,

    // Connection management
    reconnect,

    // Socket instance (for advanced usage)
    socket: socketRef.current
  };
}
