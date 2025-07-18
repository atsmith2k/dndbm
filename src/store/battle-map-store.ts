import { create } from 'zustand';
import { BattleMapData, MapEntity, GridCell, Tool, Position } from '@/types/battle-map';
import { historyManager } from '@/utils/history-manager';
import {
  createAddTerrainCommand,
  createRemoveTerrainCommand,
  createAddEntityCommand,
  createRemoveEntityCommand,
  createMoveEntityCommand
} from '@/utils/command-factory';

interface BattleMapStore {
  // Map state
  currentMap: BattleMapData | null;
  selectedTool: Tool | null;
  selectedEntity: MapEntity | null;
  isDrawing: boolean;
  zoom: number;
  pan: Position;

  // History state
  canUndo: boolean;
  canRedo: boolean;

  // Selection state
  selectedCells: Position[];
  selectedEntities: string[];
  selectionMode: 'none' | 'rectangle' | 'lasso';
  isSelecting: boolean;
  
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

  // Command-based operations (with history)
  addTerrainWithHistory: (cell: GridCell) => void;
  removeTerrainWithHistory: (position: Position) => void;
  addEntityWithHistory: (entity: MapEntity) => void;
  removeEntityWithHistory: (entityId: string) => void;
  moveEntityWithHistory: (entityId: string, fromPosition: Position, toPosition: Position) => void;

  // History operations
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  updateHistoryState: () => void;

  // Selection operations
  setSelectionMode: (mode: 'none' | 'rectangle' | 'lasso') => void;
  setIsSelecting: (selecting: boolean) => void;
  addToSelection: (cells: Position[], entities: string[]) => void;
  removeFromSelection: (cells: Position[], entities: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  selectInRectangle: (start: Position, end: Position) => void;
  
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

  // History state
  canUndo: false,
  canRedo: false,

  // Selection state
  selectedCells: [],
  selectedEntities: [],
  selectionMode: 'none',
  isSelecting: false,
  
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
  },

  // Command-based operations (with history)
  addTerrainWithHistory: (cell) => {
    const state = get();
    const command = createAddTerrainCommand(cell, get());
    historyManager.executeCommand(command);
    get().updateHistoryState();
  },

  removeTerrainWithHistory: (position) => {
    const state = get();
    const previousCell = state.getTerrainAt(position);
    const command = createRemoveTerrainCommand(position, previousCell || undefined, get());
    historyManager.executeCommand(command);
    get().updateHistoryState();
  },

  addEntityWithHistory: (entity) => {
    const command = createAddEntityCommand(entity, get());
    historyManager.executeCommand(command);
    get().updateHistoryState();
  },

  removeEntityWithHistory: (entityId) => {
    const state = get();
    const entity = state.currentMap?.entities.find(e => e.id === entityId);
    if (entity) {
      const command = createRemoveEntityCommand(entity, get());
      historyManager.executeCommand(command);
      get().updateHistoryState();
    }
  },

  moveEntityWithHistory: (entityId, fromPosition, toPosition) => {
    const command = createMoveEntityCommand(entityId, fromPosition, toPosition, get());
    historyManager.executeCommand(command);
    get().updateHistoryState();
  },

  // History operations
  undo: () => {
    if (historyManager.undo()) {
      get().updateHistoryState();
    }
  },

  redo: () => {
    if (historyManager.redo()) {
      get().updateHistoryState();
    }
  },

  clearHistory: () => {
    historyManager.clear();
    get().updateHistoryState();
  },

  updateHistoryState: () => {
    set({
      canUndo: historyManager.canUndo(),
      canRedo: historyManager.canRedo()
    });
  },

  // Selection operations
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setIsSelecting: (selecting) => set({ isSelecting: selecting }),

  addToSelection: (cells, entities) => set((state) => ({
    selectedCells: [...new Set([...state.selectedCells, ...cells])],
    selectedEntities: [...new Set([...state.selectedEntities, ...entities])]
  })),

  removeFromSelection: (cells, entities) => set((state) => ({
    selectedCells: state.selectedCells.filter(cell =>
      !cells.some(c => c.x === cell.x && c.y === cell.y)
    ),
    selectedEntities: state.selectedEntities.filter(id => !entities.includes(id))
  })),

  clearSelection: () => set({
    selectedCells: [],
    selectedEntities: [],
    isSelecting: false
  }),

  selectAll: () => set((state) => {
    if (!state.currentMap) return state;

    const allCells: Position[] = [];
    for (let x = 0; x < state.currentMap.width; x++) {
      for (let y = 0; y < state.currentMap.height; y++) {
        allCells.push({ x, y });
      }
    }

    return {
      selectedCells: allCells,
      selectedEntities: state.currentMap.entities.map(e => e.id)
    };
  }),

  selectInRectangle: (start, end) => set((state) => {
    if (!state.currentMap) return state;

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const selectedCells: Position[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (x >= 0 && x < state.currentMap.width && y >= 0 && y < state.currentMap.height) {
          selectedCells.push({ x, y });
        }
      }
    }

    const selectedEntities = state.currentMap.entities
      .filter(entity =>
        entity.position.x >= minX && entity.position.x <= maxX &&
        entity.position.y >= minY && entity.position.y <= maxY
      )
      .map(entity => entity.id);

    return { selectedCells, selectedEntities };
  })
}));
