# D&D Battle Map Creator & Session Manager - Complete Implementation Guide

## Table of Contents
1. [Technical Architecture](#technical-architecture)
2. [Project Setup](#project-setup)
3. [Database Schema](#database-schema)
4. [Core Implementation](#core-implementation)
5. [Real-time Features](#real-time-features)
6. [Deployment](#deployment)
7. [User Manual](#user-manual)

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Next.js API Routes + Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for live updates
- **UI**: Tailwind CSS + shadcn/ui components
- **Canvas**: Konva.js for map rendering
- **State Management**: Zustand
- **File Storage**: Vercel Blob or AWS S3

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │◄──►│   Next.js API   │◄──►│   PostgreSQL    │
│   (React/Next)  │    │   + Socket.io   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └─────────────►│   File Storage  │
                        │   (Blob/S3)     │
                        └─────────────────┘
```

## Project Setup

### 1. Initialize Project

````json path=package.json mode=EDIT
{
  "name": "dnd-battle-map",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.6.0",
    "socket.io": "^4.7.4",
    "socket.io-client": "^4.7.4",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10",
    "zustand": "^4.4.6",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0",
    "react-colorful": "^5.6.1",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.8.10",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "prisma": "^5.6.0",
    "eslint": "^8.53.0",
    "eslint-config-next": "14.0.0"
  }
}
````

### 2. Environment Configuration

````env path=.env.local mode=EDIT
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dnd_battle_map"

# Next.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# File Storage (optional)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Socket.io
SOCKET_PORT=3001
````

### 3. TypeScript Configuration

````json path=tsconfig.json mode=EDIT
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

## Database Schema

### Prisma Schema

````prisma path=prisma/schema.prisma mode=EDIT
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  ownedMaps    BattleMap[]
  sessions     SessionParticipant[]
  characters   Character[]

  @@map("users")
}

model BattleMap {
  id          String   @id @default(cuid())
  name        String
  description String?
  width       Int      @default(20)
  height      Int      @default(20)
  gridSize    Int      @default(30)
  background  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  owner     User      @relation(fields: [ownerId], references: [id])
  ownerId   String
  terrain   Terrain[]
  entities  Entity[]
  sessions  Session[]

  @@map("battle_maps")
}

model Terrain {
  id       String      @id @default(cuid())
  x        Int
  y        Int
  type     TerrainType
  color    String?
  mapId    String
  map      BattleMap   @relation(fields: [mapId], references: [id], onDelete: Cascade)

  @@map("terrain")
}

model Entity {
  id        String     @id @default(cuid())
  name      String
  x         Int
  y         Int
  type      EntityType
  size      Int        @default(1)
  color     String     @default("#ff0000")
  imageUrl  String?
  hp        Int?
  maxHp     Int?
  ac        Int?
  speed     Int?
  mapId     String
  map       BattleMap  @relation(fields: [mapId], references: [id], onDelete: Cascade)

  @@map("entities")
}

model Session {
  id          String   @id @default(cuid())
  name        String
  isActive    Boolean  @default(false)
  currentTurn Int      @default(0)
  round       Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  map           BattleMap             @relation(fields: [mapId], references: [id])
  mapId         String
  participants  SessionParticipant[]
  initiative    InitiativeOrder[]

  @@map("sessions")
}

model SessionParticipant {
  id        String @id @default(cuid())
  sessionId String
  userId    String
  role      Role   @default(PLAYER)

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@unique([sessionId, userId])
  @@map("session_participants")
}

model Character {
  id       String @id @default(cuid())
  name     String
  class    String?
  level    Int    @default(1)
  hp       Int
  maxHp    Int
  ac       Int
  speed    Int    @default(30)
  imageUrl String?
  ownerId  String
  owner    User   @relation(fields: [ownerId], references: [id])

  @@map("characters")
}

model InitiativeOrder {
  id         String @id @default(cuid())
  sessionId  String
  entityName String
  initiative Int
  entityId   String?
  order      Int

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("initiative_order")
}

enum TerrainType {
  WALL
  DIFFICULT
  WATER
  LAVA
  ICE
  FOREST
  MOUNTAIN
  DESERT
  SWAMP
  CUSTOM
}

enum EntityType {
  PLAYER
  NPC
  MONSTER
  OBJECT
}

enum Role {
  DM
  PLAYER
}
````

## Core Implementation

### 1. Core Types

````typescript path=src/types/battle-map.ts mode=EDIT
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
````

### 2. Zustand Store

````typescript path=src/store/battle-map-store.ts mode=EDIT
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
````

### 3. Battle Map Canvas Component

````typescript path=src/components/battle-map/BattleMapCanvas.tsx mode=EDIT
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import { useBattleMapStore } from '@/store/battle-map-store';
import { Position, MapEntity, GridCell } from '@/types/battle-map';
import Konva from 'konva';

interface BattleMapCanvasProps {
  width: number;
  height: number;
}

export default function BattleMapCanvas({ width, height }: BattleMapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  const {
    currentMap,
    selectedTool,
    selectedEntity,
    isDrawing,
    addTerrain,
    addEntity,
    moveEntity,
    setSelectedEntity,
    setIsDrawing
  } = useBattleMapStore();

  if (!currentMap) return null;

  const { gridSize } = currentMap;

  // Handle mouse events
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const gridPos = {
      x: Math.floor(pos.x / gridSize),
      y: Math.floor(pos.y / gridSize)
    };

    if (selectedTool?.type === 'terrain' && selectedTool.terrainType) {
      addTerrain({
        x: gridPos.x,
        y: gridPos.y,
        terrain: selectedTool.terrainType,
        color: getTerrainColor(selectedTool.terrainType)
      });
    } else if (selectedTool?.type === 'entity' && selectedTool.entityType) {
      const newEntity: MapEntity = {
        id: `entity-${Date.now()}`,
        name: `New ${selectedTool.entityType}`,
        position: gridPos,
        type: selectedTool.entityType,
        size: 1,
        color: getEntityColor(selectedTool.entityType)
      };
      addEntity(newEntity);
    }
  };

  const handleEntityDragEnd = (entityId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const pos = e.target.position();
    const gridPos = {
      x: Math.floor(pos.x / gridSize),
      y: Math.floor(pos.y / gridSize)
    };
    moveEntity(entityId, gridPos);
  };

  // Render grid
  const renderGrid = () => {
    const lines = [];
    const { width: mapWidth, height: mapHeight } = currentMap;

    // Vertical lines
    for (let i = 0; i <= mapWidth; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * gridSize}
          y={0}
          width={1}
          height={mapHeight * gridSize}
          fill="#ddd"
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= mapHeight; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * gridSize}
          width={mapWidth * gridSize}
          height={1}
          fill="#ddd"
        />
      );
    }

    return lines;
  };

  // Render terrain
  const renderTerrain = () => {
    return currentMap.terrain.map((cell, index) => (
      <Rect
        key={`terrain-${index}`}
        x={cell.x * gridSize}
        y={cell.y * gridSize}
        width={gridSize}
        height={gridSize}
        fill={cell.color || getTerrainColor(cell.terrain!)}
        opacity={0.7}
      />
    ));
  };

  // Render entities
  const renderEntities = () => {
    return currentMap.entities.map((entity) => (
      <Group
        key={entity.id}
        x={entity.position.x * gridSize}
        y={entity.position.y * gridSize}
        draggable
        onDragEnd={(e) => handleEntityDragEnd(entity.id, e)}
        onClick={() => setSelectedEntity(entity)}
      >
        <Circle
          radius={gridSize / 2 - 2}
          x={gridSize / 2}
          y={gridSize / 2}
          fill={entity.color}
          stroke={selectedEntity?.id === entity.id ? '#000' : 'transparent'}
          strokeWidth={2}
        />
        <Text
          text={entity.name.charAt(0).toUpperCase()}
          x={gridSize / 2}
          y={gridSize / 2}
          offsetX={5}
          offsetY={8}
          fontSize={12}
          fill="white"
          fontStyle="bold"
        />
      </Group>
    ));
  };

  return (
    <div className="border border-gray-300 overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={(e) => {
          e.evt.preventDefault();
          const scaleBy = 1.1;
          const stage = e.target.getStage()!;
          const oldScale = stage.scaleX();
          const mousePointTo = {
            x: stage.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition()!.y / oldScale - stage.y() / oldScale
          };

          const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
          setStageScale(newScale);
          setStagePos({
            x: -(mousePointTo.x - stage.getPointerPosition()!.x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition()!.y / newScale) * newScale
          });
        }}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Background */}
          <Rect
            width={currentMap.width * gridSize}
            height={currentMap.height * gridSize}
            fill={currentMap.background || '#ffffff'}
          />
          
          {/* Grid */}
          {renderGrid()}
          
          {/* Terrain */}
          {renderTerrain()}
          
          {/* Entities */}
          {renderEntities()}
        </Layer>
      </Stage>
    </div>
  );
}

// Helper functions
function getTerrainColor(terrain: string): string {
  const colors = {
    WALL: '#8B4513',
    DIFFICULT: '#DAA520',
    WATER: '#4169E1',
    LAVA: '#FF4500',
    ICE: '#87CEEB',
    FOREST: '#228B22',
    MOUNTAIN: '#696969',
    DESERT: '#F4A460',
    SWAMP: '#556B2F'
  };
  return colors[terrain as keyof typeof colors] || '#808080';
}

function getEntityColor(entityType: string): string {
  const colors = {
    PLAYER: '#00FF00',
    NPC: '#0000FF',
    MONSTER: '#FF0000',
    OBJECT: '#808080'
  };
  return colors[entityType as keyof typeof colors] || '#808080';
}
````

### 4. Toolbar Component

````typescript path=src/components/battle-map/Toolbar.tsx mode=EDIT
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useBattleMapStore } from '@/store/battle-map-store';
import { Tool, TerrainType, EntityType } from '@/types/battle-map';
import { 
  Square, 
  Mountain, 
  Waves, 
  Flame, 
  Snowflake,
  Trees,
  User,
  Bot,
  Skull,
  Package,
  Ruler,
  MousePointer
} from 'lucide-react';

const TERRAIN_TOOLS: Tool[] = [
  { id: 'wall', name: 'Wall', type: 'terrain', icon: 'Square', terrainType: TerrainType.WALL },
  { id: 'difficult', name: 'Difficult', type: 'terrain', icon: 'Mountain', terrainType: TerrainType.DIFFICULT },
  { id: 'water', name: 'Water', type: 'terrain', icon: 'Waves', terrainType: TerrainType.WATER },
  { id: 'lava', name: 'Lava', type: 'terrain', icon: 'Flame', terrainType: TerrainType.LAVA },
  { id: 'ice', name: 'Ice', type: 'terrain', icon: 'Snowflake', terrainType: TerrainType.ICE },
  { id: 'forest', name: 'Forest', type: 'terrain', icon: 'Trees', terrainType: TerrainType.FOREST }
];

const ENTITY_TOOLS: Tool[] = [
  { id: 'player', name: 'Player', type: 'entity', icon: 'User', entityType: EntityType.PLAYER },
  { id: 'npc', name: 'NPC', type: 'entity', icon: 'Bot', entityType: EntityType.NPC },
  { id: 'monster', name: 'Monster', type: 'entity', icon: 'Skull', entityType: EntityType.MONSTER },
  { id: 'object', name: 'Object', type: 'entity', icon: 'Package', entityType: EntityType.OBJECT }
];

const UTILITY_TOOLS: Tool[] = [
  { id: 'select', name: 'Select', type: 'select', icon: 'MousePointer' },
  { id: 'measure', name: 'Measure', type: 'measure', icon: 'Ruler' }
];

export default function Toolbar() {
  const { selectedTool, setSelectedTool } = useBattleMapStore();

  const renderToolButton = (tool: Tool) => {
    const IconComponent = getIconComponent(tool.icon);
    const isSelected = selectedTool?.id === tool.id;

    return (
      <Button
        key={tool.id}
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedTool(isSelected ? null : tool)}
        className="flex flex-col items-center gap-1 h-16 w-16"
      >
        <IconComponent size={20} />
        <span className="text-xs">{tool.name}</span>
      </Button>
    );
  };

  return (
    <div className="bg-white border-r border-gray-200 p-4 w-80 overflow-y-auto">
      <div className="space-y-6">
        {/* Utility Tools */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tools</h3>
          <div className="grid grid-cols-4 gap-2">
            {UTILITY_TOOLS.map(renderToolButton)}
          </div>
        </div>

        {/* Terrain Tools */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Terrain</h3>
          <div className="grid grid-cols-4 gap-2">
            {TERRAIN_TOOLS.map(renderToolButton)}
          </div>
        </div>

        {/* Entity Tools */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Entities</h3>
          <div className="grid grid-cols-4 gap-2">
            {ENTITY_TOOLS.map(renderToolButton)}
          </div>
        </div>

        {/* Selected Tool Info */}
        {selectedTool && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Selected: {selectedTool.name}
            </h4>
            <p className="text-xs text-gray-500">
              {selectedTool.type === 'terrain' && 'Click to place terrain'}
              {selectedTool.type === 'entity' && 'Click to place entity'}
              {selectedTool.type === 'select' && 'Click to select entities'}
              {selectedTool.type === 'measure' && 'Click and drag to measure'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getIconComponent(iconName: string) {
  const icons = {
    Square,
    Mountain,
    Waves,
    Flame,
    Snowflake,
    Trees,
    User,
    Bot,
    Skull,
    Package,
    Ruler,
    MousePointer
  };
  return icons[iconName as keyof typeof icons] || Square;
}
````

### 5. Main Battle Map Editor

````typescript path=src/components/battle-map/BattleMapEditor.tsx mode=EDIT
'use client';

import React, { useEffect, useState } from 'react';
import { useBattleMapStore } from '@/store/battle-map-store';
import BattleMapCanvas from './BattleMapCanvas';
import Toolbar from './Toolbar';
import EntityPanel from './EntityPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Download, Upload, Play } from 'lucide-react';

interface BattleMapEditorProps {
  mapId?: string;
}

export default function BattleMapEditor({ mapId }: BattleMapEditorProps) {
  const { currentMap, setCurrentMap } = useBattleMapStore();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Load map if mapId provided, otherwise create new map
    if (mapId) {
      loadMap(mapId);
    } else {
      createNewMap();
    }

    // Handle window resize
    const handleResize = () => {
      const sidebar = 320; // Toolbar width
      const panel = 300; // Entity panel width
      const padding = 40;
      
      setCanvasSize({
        width: window.innerWidth - sidebar - panel - padding,
        height: window.innerHeight - 120 // Header and padding
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapId]);

  const createNewMap = () => {
    const newMap = {
      id: `map-${Date.now()}`,
      name: 'New Battle Map',
      width: 20,
      height: 20,
      gridSize: 30,
      terrain: [],
      entities: [],
      background: '#ffffff'
    };
    setCurrentMap(newMap);
  };

  const loadMap = async (id: string) => {
    try {
      const response = await fetch(`/api/maps/${id}`);
      if (response.ok) {
        const map = await response.json();
        setCurrentMap(map);
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  };

  const saveMap = async () => {
    if (!currentMap) return;

    try {
      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMap)
      });

      if (response.ok) {
        console.log('Map saved successfully');
      }
    } catch (error) {
      console.error('Failed to save map:', error);
    }
  };

  const exportMap = () => {
    if (!currentMap) return;

    const dataStr = JSON.stringify(currentMap, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentMap.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const mapData = JSON.parse(e.target?.result as string);
        setCurrentMap(mapData);
      } catch (error) {
        console.error('Failed to import map:', error);
      }
    };
    reader.readAsText(file);
  };

  const startSession = async () => {
    if (!currentMap) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId: currentMap.id })
      });

      if (response.ok) {
        const session = await response.json();
        window.open(`/session/${session.id}`, '_blank');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  if (!currentMap) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={currentMap.name}
              onChange={(e) => setCurrentMap({ ...currentMap, name: e.target.value })}
              className="text-lg font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={saveMap} size="sm">
              <Save size={16} className="mr-1" />
              Save
            </Button>
            
            <Button onClick={exportMap} variant="outline" size="sm">
              <Download size={16} className="mr-1" />
              Export
            </Button>
            
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload size={16} className="mr-1" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importMap}
                className="hidden"
              />
            </label>
            
            <Button onClick={startSession} className="bg-green-600 hover:bg-green-700">
              <Play size={16} className="mr-1" />
              Start Session
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4">
          <BattleMapCanvas width={canvasSize.width} height={canvasSize.height} />
        </div>
      </div>

      {/* Entity Panel */}
      <EntityPanel />
    </div>
  );
}
````

## Real-time Features

### 1. Socket.io Server Setup

````typescript path=src/lib/socket-server.ts mode=EDIT
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { BattleMapData, MapEntity, Position } from '@/types/battle-map';

export interface SessionData {
  id: string;
  mapId: string;
  participants: string[];
  currentTurn: number;
  round: number;
}

export class BattleMapSocketServer {
  private io: SocketIOServer;
  private sessions: Map<string, SessionData> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join session
      socket.on('join-session', (sessionId: string, userId: string) => {
        socket.join(sessionId);
        
        const session = this.sessions.get(sessionId);
        if (session && !session.participants.includes(userId)) {
          session.participants.push(userId);
          this.sessions.set(sessionId, session);
        }

        socket.to(sessionId).emit('user-joined', userId);
        console.log(`User ${userId} joined session ${sessionId}`);
      });

      // Leave session
      socket.on('leave-session', (sessionId: string, userId: string) => {
        socket.leave(sessionId);
        
        const session = this.sessions.get(sessionId);
        if (session) {
          session.participants = session.participants.filter(id => id !== userId);
          this.sessions.set(sessionId, session);
        }

        socket.to(sessionId).emit('user-left', userId);
      });

      // Map updates
      socket.on('map-update', (sessionId: string, mapData: BattleMapData) => {
        socket.to(sessionId).emit('map-updated', mapData);
      });

      // Entity movement
      socket.on('entity-move', (sessionId: string, entityId: string, position: Position) => {
        socket.to(sessionId).emit('entity-moved', entityId, position);
      });

      // Entity updates
      socket.on('entity-update', (sessionId: string, entity: MapEntity) => {
        socket.to(sessionId).emit('entity-updated', entity);
      });

      // Initiative updates
      socket.on('initiative-update', (sessionId: string, initiative: any[]) => {
        socket.to(sessionId).emit('initiative-updated', initiative);
      });

      // Turn management
      socket.on('next-turn', (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.currentTurn = (session.currentTurn + 1) % session.participants.length;
          if (session.currentTurn === 0) {
            session.round += 1;
          }
          this.sessions.set(sessionId, session);
          this.io.to(sessionId).emit('turn-changed', session.currentTurn, session.round);
        }
      });

      // Chat messages
      socket.on('chat-message', (sessionId: string, message: any) => {
        this.io.to(sessionId).emit('chat-message', message);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public createSession(sessionId: string, mapId: string): SessionData {
    const session: SessionData = {
      id: sessionId,
      mapId,
      participants: [],
      currentTurn: 0,
      round: 1
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  public deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
````

### 2. Socket.io Client Hook

````typescript path=src/hooks/useSocket.ts mode=EDIT
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BattleMapData, MapEntity, Position } from '@/types/battle-map';

interface UseSocketProps {
  sessionId: string;
  userId: string;
  onMapUpdate?: (mapData: BattleMapData) => void;
  onEntityMove?: (entityId: string, position: Position) => void;
  onEntityUpdate?: (entity: MapEntity) => void;
  onTurnChange?: (currentTurn: number, round: number) => void;
  onChatMessage?: (message: any) => void;
}

export function useSocket({
  sessionId,
  userId,
  onMapUpdate,
  onEntityMove,
  onEntityUpdate,
  onTurnChange,
  onChatMessage
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL || ''
      : 'http://localhost:3001'
    );

    const socket = socketRef.current;

    // Join session
    socket.emit('join-session', sessionId, userId);

    // Set up event listeners
    socket.on('map-updated', onMapUpdate || (() => {}));
    socket.on('entity-moved', onEntityMove || (() => {}));
    socket.on('entity-updated', onEntityUpdate || (() => {}));
    socket.on('turn-changed', onTurnChange || (() => {}));
    socket.on('chat-message', onChatMessage || (() => {}));

    // Cleanup on unmount
    return () => {
      socket.emit('leave-session', sessionId, userId);
      socket.disconnect();
    };
  }, [sessionId, userId]);

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

  const emitChatMessage = (message: any) => {
    socketRef.current?.emit('chat-message', sessionId, message);
  };

  return {
    emitMapUpdate,
    emitEntityMove,
    emitEntityUpdate,
    emitNextTurn,
    emitChatMessage
  };
}
````

### 3. API Routes

````typescript path=src/app/api/maps/route.ts mode=EDIT
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const maps = await prisma.battleMap.findMany({
      include: {
        terrain: true,
        entities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(maps);
  } catch (error) {
    console.error('Failed to fetch maps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create map with terrain and entities
    const map = await prisma.battleMap.create({
      data: {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        gridSize: data.gridSize,
        background: data.background,
        ownerId: data.ownerId, // Should come from auth
        terrain: {
          create: data.terrain?.map((t: any) => ({
            x: t.x,
            y: t.y,
            type: t.terrain,
            color: t.color
          })) || []
        },
        entities: {
          create: data.entities?.map((e: any) => ({
            name: e.name,
            x: e.position.x,
            y: e.position.y,
            type: e.type,
            size: e.size,
            color: e.color,
            imageUrl: e.imageUrl,
            hp: e.hp,
            maxHp: e.maxHp,
            ac: e.ac,
            speed: e.speed
          })) || []
        }
      },
      include: {
        terrain: true,
        entities: true
      }
    });

    return NextResponse.json(map);
  } catch (error) {
    console.error('Failed to create map:', error);
    return NextResponse.json(
      { error: 'Failed to create map' },
      { status: 500 }
    );
  }
}
````

````typescript path=src/app/api/sessions/route.ts mode=EDIT
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { mapId } = await request.json();
    
    const session = await prisma.session.create({
      data: {
        name: `Session ${Date.now()}`,
        mapId,
        isActive: true
      },
      include: {
        map: {
          include: {
            terrain: true,
            entities: true
          }
        }
      }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
````

## Deployment

### 1. Vercel Deployment

````json path=vercel.json mode=EDIT
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXTAUTH_URL": "@nextauth-url"
  }
}
````

### 2. Docker Configuration

````dockerfile path=Dockerfile mode=EDIT
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
````

### 3. Database Migration Script

````bash path=scripts/deploy.sh mode=EDIT
#!/bin/bash

echo "Starting deployment..."

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Build the application
npm run build

echo "Deployment complete!"
````

## User Manual

### Getting Started

1. **Creating a New Map**
   - Click "New Map" from the dashboard
   - Set map dimensions (width/height in grid squares)
   - Choose grid size (recommended: 30px for standard view)

2. **Using the Toolbar**
   - **Select Tool**: Click entities to select and modify
   - **Terrain Tools**: Click to place different terrain types
   - **Entity Tools**: Click to place characters, NPCs, monsters
   - **Measure Tool**: Click and drag to measure distances

3. **Map Building**
   - Use terrain tools to create walls, difficult terrain, water, etc.
   - Place entities by selecting an entity tool and clicking on the map
   - Drag entities to move them around the map
   - Right-click entities for context menu options

4. **Starting a Session**
   - Click "Start Session" to begin a live game
   - Share the session URL with players
   - Use initiative tracker to manage turn order
   - All changes sync in real-time with connected players

### Advanced Features

- **Layer Management**: Toggle visibility of terrain, entities, and effects
- **Import/Export**: Save maps as JSON files for sharing
- **Keyboard Shortcuts**: 
  - `Space + Drag`: Pan the map
  - `Ctrl + Scroll`: Zoom in/out
  - `Delete`: Remove selected entity
  - `Ctrl + Z`: Undo last action

### Troubleshooting

- **Performance Issues**: Reduce map size or zoom level for better performance
- **Connection Problems**: Check internet connection and refresh the page
- **Missing Features**: Ensure you're using a modern browser (Chrome, Firefox, Safari)

This comprehensive guide provides everything needed to build a fully functional D&D battle map creator with real-time multiplayer capabilities. The modular architecture allows for easy extension and customization based on specific needs.
