import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BattleMapData, MapEntity, Position, ChatMessage } from '@/types/battle-map';

interface UseSocketProps {
  sessionId: string;
  userId: string;
  onMapUpdate?: (mapData: BattleMapData) => void;
  onEntityMove?: (entityId: string, position: Position) => void;
  onEntityUpdate?: (entity: MapEntity) => void;
  onTurnChange?: (currentTurn: number, round: number) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
}

export function useSocket({
  sessionId,
  userId,
  onMapUpdate,
  onEntityMove,
  onEntityUpdate,
  onTurnChange,
  onChatMessage,
  onUserJoined,
  onUserLeft
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      : 'http://localhost:3000';
      
    socketRef.current = io(socketUrl);

    const socket = socketRef.current;

    // Join session
    socket.emit('join-session', sessionId, userId);

    // Set up event listeners
    if (onMapUpdate) socket.on('map-updated', onMapUpdate);
    if (onEntityMove) socket.on('entity-moved', onEntityMove);
    if (onEntityUpdate) socket.on('entity-updated', onEntityUpdate);
    if (onTurnChange) socket.on('turn-changed', onTurnChange);
    if (onChatMessage) socket.on('chat-message', onChatMessage);
    if (onUserJoined) socket.on('user-joined', onUserJoined);
    if (onUserLeft) socket.on('user-left', onUserLeft);

    // Cleanup on unmount
    return () => {
      socket.emit('leave-session', sessionId, userId);
      socket.disconnect();
    };
  }, [sessionId, userId, onMapUpdate, onEntityMove, onEntityUpdate, onTurnChange, onChatMessage, onUserJoined, onUserLeft]);

  // Emit functions
  const emitMapUpdate = (mapData: BattleMapData) => {
    socketRef.current?.emit('map-update', sessionId, mapData);
  };

  const emitEntityMove = (entityId: string, position: Position) => {
    socketRef.current?.emit('entity-move', sessionId, entityId, position);
  };

  const emitEntityUpdate = (entity: MapEntity) => {
    socketRef.current?.emit('entity-update', sessionId, entity);
  };

  const emitNextTurn = () => {
    socketRef.current?.emit('next-turn', sessionId);
  };

  const emitChatMessage = (message: ChatMessage) => {
    socketRef.current?.emit('chat-message', sessionId, message);
  };

  const emitInitiativeUpdate = (initiative: any[]) => {
    socketRef.current?.emit('initiative-update', sessionId, initiative);
  };

  return {
    emitMapUpdate,
    emitEntityMove,
    emitEntityUpdate,
    emitNextTurn,
    emitChatMessage,
    emitInitiativeUpdate,
    isConnected: socketRef.current?.connected || false
  };
}
