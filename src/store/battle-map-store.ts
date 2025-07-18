import { create } from 'zustand';
import { BattleMapData, MapEntity, GridCell, Tool, Position } from '@/types/battle-map';

interface BattleMapStore {
  // Map state
  currentMap: BattleMapData | null;
  selectedTool: Tool | null;
  selectedEntity: MapEntity | null;
  isDrawing: boolean;
  zoom: number;
  pan: Position;
  
  // Actions
  setCurrentMap: (map: BattleMapData) => void;
  setSelectedTool: (tool: Tool | null) => void;
  setSelectedEntity: (entity: MapEntity | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  
  // Map manipulation
  addTerrain: (cell: GridCell) => void;
  removeTerrain: (position: Position) => void;
  addEntity: (entity: MapEntity) => void;
  updateEntity: (id: string, updates: Partial<MapEntity>) => void;
  removeEntity: (id: string) => void;
  moveEntity: (id: string, position: Position) => void;
  
  // Utility
  getEntityAt: (position: Position) => MapEntity | null;
  getTerrainAt: (position: Position) => GridCell | null;
}

export const useBattleMapStore = create<BattleMapStore>((set, get) => ({
  // Initial state
  currentMap: null,
  selectedTool: null,
  selectedEntity: null,
  isDrawing: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  // Actions
  setCurrentMap: (map) => set({ currentMap: map }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  
  // Map manipulation
  addTerrain: (cell) => set((state) => {
    if (!state.currentMap) return state;
    const terrain = state.currentMap.terrain.filter(
      t => !(t.x === cell.x && t.y === cell.y)
    );
    terrain.push(cell);
    return {
      currentMap: { ...state.currentMap, terrain }
    };
  }),
  
  removeTerrain: (position) => set((state) => {
    if (!state.currentMap) return state;
    const terrain = state.currentMap.terrain.filter(
      t => !(t.x === position.x && t.y === position.y)
    );
    return {
      currentMap: { ...state.currentMap, terrain }
    };
  }),
  
  addEntity: (entity) => set((state) => {
    if (!state.currentMap) return state;
    return {
      currentMap: {
        ...state.currentMap,
        entities: [...state.currentMap.entities, entity]
      }
    };
  }),
  
  updateEntity: (id, updates) => set((state) => {
    if (!state.currentMap) return state;
    const entities = state.currentMap.entities.map(entity =>
      entity.id === id ? { ...entity, ...updates } : entity
    );
    return {
      currentMap: { ...state.currentMap, entities }
    };
  }),
  
  removeEntity: (id) => set((state) => {
    if (!state.currentMap) return state;
    const entities = state.currentMap.entities.filter(e => e.id !== id);
    return {
      currentMap: { ...state.currentMap, entities },
      selectedEntity: state.selectedEntity?.id === id ? null : state.selectedEntity
    };
  }),
  
  moveEntity: (id, position) => set((state) => {
    if (!state.currentMap) return state;
    const entities = state.currentMap.entities.map(entity =>
      entity.id === id ? { ...entity, position } : entity
    );
    return {
      currentMap: { ...state.currentMap, entities }
    };
  }),
  
  // Utility functions
  getEntityAt: (position) => {
    const state = get();
    if (!state.currentMap) return null;
    return state.currentMap.entities.find(
      entity => entity.position.x === position.x && entity.position.y === position.y
    ) || null;
  },
  
  getTerrainAt: (position) => {
    const state = get();
    if (!state.currentMap) return null;
    return state.currentMap.terrain.find(
      terrain => terrain.x === position.x && terrain.y === position.y
    ) || null;
  }
}));
