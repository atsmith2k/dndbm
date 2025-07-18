export const TERRAIN_COLORS = {
  WALL: '#8B4513',
  DIFFICULT: '#DAA520',
  WATER: '#4169E1',
  LAVA: '#FF4500',
  ICE: '#87CEEB',
  FOREST: '#228B22',
  MOUNTAIN: '#696969',
  DESERT: '#F4A460',
  SWAMP: '#556B2F',
  CUSTOM: '#808080'
} as const;

export const ENTITY_COLORS = {
  PLAYER: '#00FF00',
  NPC: '#0000FF',
  MONSTER: '#FF0000',
  OBJECT: '#808080'
} as const;

export const DEFAULT_MAP_SETTINGS = {
  width: 20,
  height: 20,
  gridSize: 30,
  background: '#ffffff'
} as const;

export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
