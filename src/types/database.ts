import { BattleMap, Entity, Terrain, Session, User, SessionParticipant, InitiativeOrder } from '@prisma/client';

export type BattleMapWithRelations = BattleMap & {
  terrain: Terrain[];
  entities: Entity[];
  owner: Pick<User, 'id' | 'name' | 'email'>;
  sessions?: Session[];
};

export type SessionWithRelations = Session & {
  map: BattleMapWithRelations;
  participants: (SessionParticipant & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  initiative: InitiativeOrder[];
};

// Enhanced session type with new fields
export type EnhancedSession = Session & {
  joinCode: string;
  expiresAt: Date | null;
  lastActivity: Date;
};

export type EnhancedSessionParticipant = SessionParticipant & {
  assignedCharacterId: string | null;
  displayName: string | null;
  isConnected: boolean;
  lastSeen: Date;
};

export type SessionWithEnhancedRelations = EnhancedSession & {
  map: BattleMapWithRelations;
  participants: (EnhancedSessionParticipant & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  initiative: InitiativeOrder[];
};

export type EntityWithMap = Entity & {
  map: BattleMap;
};

export type TerrainWithMap = Terrain & {
  map: BattleMap;
};
