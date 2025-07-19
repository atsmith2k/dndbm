import { io, Socket } from 'socket.io-client';

interface RealtimeConfig {
  sessionId: string;
  userId: string;
  displayName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class RealtimeClient {
  private socket: Socket | null = null;
  private config: RealtimeConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  connect() {
    if (this.socket?.connected) return;

    // For Vercel deployment, we'll use polling as fallback
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      : 'http://localhost:3000';

    this.socket = io(socketUrl, {
      path: '/api/socket',
      transports: process.env.NODE_ENV === 'production' 
        ? ['polling'] // Use polling for Vercel compatibility
        : ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
      
      // Join session
      this.socket?.emit('join-session', this.config.sessionId, this.config.userId, this.config.displayName);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.config.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.config.onError?.(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.log('Failed to reconnect after maximum attempts');
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave-session', this.config.sessionId, this.config.userId);
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event emission methods
  emitMapUpdate(mapData: any) {
    this.socket?.emit('map-update', this.config.sessionId, mapData, this.config.userId);
  }

  emitEntityMove(entityId: string, position: any) {
    this.socket?.emit('entity-move', this.config.sessionId, entityId, position, this.config.userId);
  }

  emitCursorMove(position: any) {
    this.socket?.emit('cursor-move', this.config.sessionId, this.config.userId, position);
  }

  emitChatMessage(message: any) {
    this.socket?.emit('chat-message', this.config.sessionId, message);
  }

  // Event listener methods
  onMapUpdated(callback: (mapData: any, updatedBy: string) => void) {
    this.socket?.on('map-updated', callback);
  }

  onEntityMoved(callback: (entityId: string, position: any, movedBy: string) => void) {
    this.socket?.on('entity-moved', callback);
  }

  onUserJoined(callback: (user: any) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (userId: string) => void) {
    this.socket?.on('user-left', callback);
  }

  onCursorMoved(callback: (userId: string, position: any) => void) {
    this.socket?.on('cursor-moved', callback);
  }

  onPermissionDenied(callback: (action: string, reason: string) => void) {
    this.socket?.on('permission-denied', callback);
  }

  onSessionState(callback: (state: any) => void) {
    this.socket?.on('session-state', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get socketId() {
    return this.socket?.id;
  }
}

export default RealtimeClient;
