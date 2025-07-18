import { Position, GridCell, MapEntity } from './battle-map';

// Command interface for undo/redo system
export interface Command {
  id: string;
  type: string;
  execute(): void;
  undo(): void;
  description: string;
}

// Terrain Commands
export interface AddTerrainCommand extends Command {
  type: 'ADD_TERRAIN';
  cell: GridCell;
}

export interface RemoveTerrainCommand extends Command {
  type: 'REMOVE_TERRAIN';
  position: Position;
  previousCell?: GridCell;
}

export interface BulkTerrainCommand extends Command {
  type: 'BULK_TERRAIN';
  cells: GridCell[];
  previousCells: GridCell[];
}

// Entity Commands
export interface AddEntityCommand extends Command {
  type: 'ADD_ENTITY';
  entity: MapEntity;
}

export interface RemoveEntityCommand extends Command {
  type: 'REMOVE_ENTITY';
  entity: MapEntity;
}

export interface MoveEntityCommand extends Command {
  type: 'MOVE_ENTITY';
  entityId: string;
  fromPosition: Position;
  toPosition: Position;
}

export interface BulkEntityCommand extends Command {
  type: 'BULK_ENTITY';
  entities: MapEntity[];
  operation: 'ADD' | 'REMOVE' | 'MOVE';
  previousData?: any;
}

// Selection Commands
export interface SelectionCommand extends Command {
  type: 'SELECTION';
  selectedCells: Position[];
  selectedEntities: string[];
  previousSelection: {
    cells: Position[];
    entities: string[];
  };
}

// Map Commands
export interface MapPropertyCommand extends Command {
  type: 'MAP_PROPERTY';
  property: string;
  newValue: any;
  previousValue: any;
}

// Union type for all commands
export type MapCommand = 
  | AddTerrainCommand 
  | RemoveTerrainCommand 
  | BulkTerrainCommand
  | AddEntityCommand 
  | RemoveEntityCommand 
  | MoveEntityCommand
  | BulkEntityCommand
  | SelectionCommand
  | MapPropertyCommand;

// History manager interface
export interface HistoryManager {
  executeCommand(command: MapCommand): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  getHistory(): MapCommand[];
  getHistoryIndex(): number;
}
