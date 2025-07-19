import { BattleMapData, Position } from './battle-map';

export interface SessionMapData extends BattleMapData {
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface SessionData {
  id: string;
  name: string;
  joinCode: string;
  mapId: string;
  isActive: boolean;
  currentTurn: number;
  round: number;
  expiresAt: Date | null;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  map?: SessionMapData;
  participants: SessionParticipant[];
  initiative: InitiativeEntry[];
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  role: Role;
  assignedCharacterId?: string;
  displayName?: string;
  isConnected: boolean;
  lastSeen: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface InitiativeEntry {
  id: string;
  sessionId: string;
  entityName: string;
  initiative: number;
  entityId?: string;
  order: number;
}

export type Role = 'DM' | 'PLAYER';

export interface UserPresence {
  userId: string;
  displayName: string;
  role: Role;
  isConnected: boolean;
  cursor?: Position;
  lastActivity: Date;
  socketId?: string;
}

export interface SessionState {
  session: SessionData;
  connectedUsers: UserPresence[];
  currentUser?: SessionParticipant;
}

export interface JoinSessionRequest {
  joinCode: string;
  displayName?: string;
  userId?: string; // Optional for guest users
}

export interface CreateSessionRequest {
  name?: string;
  mapId: string;
  userId: string;
  expiresAt?: Date;
}

export interface SessionPermissions {
  canEditMap: boolean;
  canMoveAnyEntity: boolean;
  canManageParticipants: boolean;
  canControlSession: boolean;
  canAssignCharacters: boolean;
  canKickUsers: boolean;
  canModifyTerrain: boolean;
  canManageInitiative: boolean;
  canMoveAssignedCharacter: boolean;
  canViewMap: boolean;
  canChat: boolean;
}

export interface SessionAction {
  type: string;
  userId: string;
  timestamp: Date;
  data: any;
}

export interface ConflictResolution {
  conflictId: string;
  type: 'entity_move' | 'terrain_edit' | 'map_change';
  conflictingActions: SessionAction[];
  resolution: 'last_write_wins' | 'admin_override' | 'merge';
  resolvedBy?: string;
  resolvedAt?: Date;
}

// Socket event types
export interface SocketEvents {
  // Session management
  'join-session': (sessionId: string, userId: string, displayName?: string) => void;
  'leave-session': (sessionId: string, userId: string) => void;
  'session-updated': (session: SessionData) => void;
  
  // User presence
  'user-joined': (user: UserPresence) => void;
  'user-left': (userId: string) => void;
  'user-presence-updated': (presence: UserPresence) => void;
  'cursor-moved': (userId: string, position: Position) => void;
  
  // Map updates
  'map-updated': (mapData: BattleMapData) => void;
  'entity-moved': (entityId: string, position: Position, userId: string) => void;
  'entity-updated': (entity: any, userId: string) => void;
  'terrain-updated': (terrain: any[], userId: string) => void;
  
  // Role management
  'role-updated': (userId: string, newRole: Role) => void;
  'character-assigned': (userId: string, characterId: string) => void;
  'participant-kicked': (userId: string, kickedBy: string) => void;
  
  // Initiative and turn management
  'initiative-updated': (initiative: InitiativeEntry[]) => void;
  'turn-changed': (currentTurn: number, round: number) => void;
  
  // Chat
  'chat-message': (message: ChatMessage) => void;
  
  // Conflict resolution
  'conflict-detected': (conflict: ConflictResolution) => void;
  'conflict-resolved': (conflictId: string, resolution: any) => void;
  
  // Error handling
  'session-error': (error: string) => void;
  'permission-denied': (action: string, reason: string) => void;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'roll' | 'action';
}

export interface SessionSettings {
  allowGuestUsers: boolean;
  maxParticipants: number;
  autoExpireHours: number;
  requireApprovalToJoin: boolean;
  allowPlayerEntityCreation: boolean;
  enableChat: boolean;
  enableDiceRolling: boolean;
}

export interface SessionInvite {
  id: string;
  sessionId: string;
  joinCode: string;
  invitedBy: string;
  expiresAt: Date;
  maxUses?: number;
  usedCount: number;
  createdAt: Date;
}

// Error types
export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class PermissionError extends SessionError {
  constructor(action: string, role: Role) {
    super(
      `Permission denied: ${role} cannot perform ${action}`,
      'PERMISSION_DENIED',
      403
    );
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(identifier: string) {
    super(
      `Session not found: ${identifier}`,
      'SESSION_NOT_FOUND',
      404
    );
  }
}

export class SessionExpiredError extends SessionError {
  constructor() {
    super(
      'Session has expired',
      'SESSION_EXPIRED',
      410
    );
  }
}

export class SessionFullError extends SessionError {
  constructor() {
    super(
      'Session is full',
      'SESSION_FULL',
      409
    );
  }
}

// Utility types
export type SessionEventHandler<T extends keyof SocketEvents> = SocketEvents[T];

export interface SessionHookOptions {
  sessionId?: string;
  userId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface SessionContextValue {
  session: SessionData | null;
  participants: SessionParticipant[];
  currentUser: SessionParticipant | null;
  permissions: SessionPermissions;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  joinSession: (request: JoinSessionRequest) => Promise<void>;
  leaveSession: () => Promise<void>;
  updateRole: (userId: string, role: Role) => Promise<void>;
  assignCharacter: (userId: string, characterId: string) => Promise<void>;
  kickParticipant: (userId: string) => Promise<void>;
}
