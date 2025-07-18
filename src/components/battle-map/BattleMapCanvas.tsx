'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import { useBattleMapStore } from '@/store/battle-map-store';
import { Position, MapEntity, GridCell } from '@/types/battle-map';
import Konva from 'konva';

interface BattleMapCanvasProps {
  width: number;
  height: number;
  onEntityMove?: (entityId: string, position: Position) => void;
}

export default function BattleMapCanvas({ width, height, onEntityMove }: BattleMapCanvasProps) {
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
      x: Math.floor((pos.x - stagePos.x) / stageScale / gridSize),
      y: Math.floor((pos.y - stagePos.y) / stageScale / gridSize)
    };

    // Ensure click is within map bounds
    if (gridPos.x < 0 || gridPos.x >= currentMap.width || gridPos.y < 0 || gridPos.y >= currentMap.height) {
      return;
    }

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
    
    // Snap to grid
    e.target.position({
      x: gridPos.x * gridSize,
      y: gridPos.y * gridSize
    });
    
    moveEntity(entityId, gridPos);
    onEntityMove?.(entityId, gridPos);
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
    <div className="border border-gray-300 overflow-hidden rounded-lg">
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
          setStageScale(Math.max(0.1, Math.min(3, newScale)));
          setStagePos({
            x: -(mousePointTo.x - stage.getPointerPosition()!.x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition()!.y / newScale) * newScale
          });
        }}
        onClick={handleStageClick}
        className="battle-map-canvas"
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
