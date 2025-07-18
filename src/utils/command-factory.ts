import {
  MapCommand,
  AddTerrainCommand,
  RemoveTerrainCommand,
  BulkTerrainCommand,
  AddEntityCommand,
  RemoveEntityCommand,
  MoveEntityCommand
} from '@/types/commands';
import { Position, GridCell, MapEntity } from '@/types/battle-map';

// Define the store actions interface
interface StoreActions {
  addTerrain: (cell: GridCell) => void;
  removeTerrain: (position: Position) => void;
  addEntity: (entity: MapEntity) => void;
  removeEntity: (id: string) => void;
  moveEntity: (id: string, position: Position) => void;
}

// Generate unique command IDs
const generateCommandId = () => `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createAddTerrainCommand = (
  cell: GridCell,
  storeActions: StoreActions
): AddTerrainCommand => ({
  id: generateCommandId(),
  type: 'ADD_TERRAIN',
  cell,
  description: `Add ${cell.terrain} terrain at (${cell.x}, ${cell.y})`,
  execute: () => {
    storeActions.addTerrain(cell);
  },
  undo: () => {
    storeActions.removeTerrain({ x: cell.x, y: cell.y });
  }
});

export const createRemoveTerrainCommand = (
  position: Position,
  previousCell: GridCell | undefined,
  storeActions: StoreActions
): RemoveTerrainCommand => ({
  id: generateCommandId(),
  type: 'REMOVE_TERRAIN',
  position,
  previousCell,
  description: `Remove terrain at (${position.x}, ${position.y})`,
  execute: () => {
    storeActions.removeTerrain(position);
  },
  undo: () => {
    if (previousCell) {
      storeActions.addTerrain(previousCell);
    }
  }
});

export const createBulkTerrainCommand = (
  cells: GridCell[],
  previousCells: GridCell[],
  storeActions: StoreActions
): BulkTerrainCommand => ({
  id: generateCommandId(),
  type: 'BULK_TERRAIN',
  cells,
  previousCells,
  description: `Bulk terrain operation (${cells.length} cells)`,
  execute: () => {
    cells.forEach(cell => storeActions.addTerrain(cell));
  },
  undo: () => {
    // Remove new cells
    cells.forEach(cell => storeActions.removeTerrain({ x: cell.x, y: cell.y }));
    // Restore previous cells
    previousCells.forEach(cell => storeActions.addTerrain(cell));
  }
});

export const createAddEntityCommand = (
  entity: MapEntity,
  storeActions: StoreActions
): AddEntityCommand => ({
  id: generateCommandId(),
  type: 'ADD_ENTITY',
  entity,
  description: `Add ${entity.type} "${entity.name}" at (${entity.position.x}, ${entity.position.y})`,
  execute: () => {
    storeActions.addEntity(entity);
  },
  undo: () => {
    storeActions.removeEntity(entity.id);
  }
});

export const createRemoveEntityCommand = (
  entity: MapEntity,
  storeActions: StoreActions
): RemoveEntityCommand => ({
  id: generateCommandId(),
  type: 'REMOVE_ENTITY',
  entity,
  description: `Remove ${entity.type} "${entity.name}"`,
  execute: () => {
    storeActions.removeEntity(entity.id);
  },
  undo: () => {
    storeActions.addEntity(entity);
  }
});

export const createMoveEntityCommand = (
  entityId: string,
  fromPosition: Position,
  toPosition: Position,
  storeActions: StoreActions
): MoveEntityCommand => ({
  id: generateCommandId(),
  type: 'MOVE_ENTITY',
  entityId,
  fromPosition,
  toPosition,
  description: `Move entity from (${fromPosition.x}, ${fromPosition.y}) to (${toPosition.x}, ${toPosition.y})`,
  execute: () => {
    storeActions.moveEntity(entityId, toPosition);
  },
  undo: () => {
    storeActions.moveEntity(entityId, fromPosition);
  }
});
