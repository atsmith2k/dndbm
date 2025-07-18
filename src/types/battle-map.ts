export interface Position {
  x: number;
  y: number;
}

export interface GridCell extends Position {
  terrain?: TerrainType;
  color?: string;
}

export interface MapEntity {
  id: string;
  name: string;
  position: Position;
  type: EntityType;
  size: number;
  color: string;
  imageUrl?: string;
  hp?: number;
  maxHp?: number;
  ac?: number;
  speed?: number;
}

export interface BattleMapData {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  terrain: GridCell[];
  entities: MapEntity[];
  background?: string;
}

export enum TerrainType {
  WALL = 'WALL',
  DIFFICULT = 'DIFFICULT',
  WATER = 'WATER',
  LAVA = 'LAVA',
  ICE = 'ICE',
  FOREST = 'FOREST',
  MOUNTAIN = 'MOUNTAIN',
  DESERT = 'DESERT',
  SWAMP = 'SWAMP',
  CUSTOM = 'CUSTOM'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  NPC = 'NPC',
  MONSTER = 'MONSTER',
  OBJECT = 'OBJECT'
}

export interface Tool {
  id: string;
  name: string;
  type: 'terrain' | 'entity' | 'measure' | 'select';
  icon: string;
  terrainType?: TerrainType;
  entityType?: EntityType;
}

export interface SessionData {
  id: string;
  name: string;
  mapId: string;
  isActive: boolean;
  currentTurn: number;
  round: number;
  participants: SessionParticipant[];
}

export interface SessionParticipant {
  id: string;
  userId: string;
  role: 'DM' | 'PLAYER';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface InitiativeEntry {
  id: string;
  entityName: string;
  initiative: number;
  entityId?: string;
  order: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'roll';
}
