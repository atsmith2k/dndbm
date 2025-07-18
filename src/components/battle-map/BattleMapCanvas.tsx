'use client';

import React, { useEffect, useState } from 'react';
import { useBattleMapStore } from '@/store/battle-map-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Position, MapEntity, GridCell } from '@/types/battle-map';

interface BattleMapCanvasProps {
  width: number;
  height: number;
  onEntityMove?: (entityId: string, position: Position) => void;
}

export default function BattleMapCanvas({ width, height, onEntityMove }: BattleMapCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [selectionStart, setSelectionStart] = useState<Position | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Position | null>(null);
  const {
    currentMap,
    selectedTool,
    addTerrainWithHistory,
    removeTerrainWithHistory,
    addEntityWithHistory,
    setSelectedEntity,
    selectedCells,
    selectedEntities,
    selectionMode,
    isSelecting,
    setSelectionMode,
    setIsSelecting,
    selectInRectangle,
    clearSelection
  } = useBattleMapStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center border border-gray-300 bg-gray-50" style={{ width, height }}>
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    );
  }

  if (!currentMap) {
    return (
      <div className="flex items-center justify-center border border-gray-300 bg-gray-50" style={{ width, height }}>
        <div className="text-gray-500">No map loaded</div>
      </div>
    );
  }

  const getGridPosition = (event: React.MouseEvent<HTMLDivElement>): Position | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / currentMap.gridSize);
    const gridY = Math.floor(y / currentMap.gridSize);

    if (gridX >= 0 && gridX < currentMap.width && gridY >= 0 && gridY < currentMap.height) {
      return { x: gridX, y: gridY };
    }
    return null;
  };

  const paintTerrain = (gridPos: Position) => {
    if (!selectedTool || selectedTool.type !== 'terrain') return;

    if (selectedTool.id === 'erase') {
      // Erase terrain
      removeTerrainWithHistory(gridPos);
    } else if (selectedTool.terrainType) {
      // Paint terrain
      addTerrainWithHistory({
        x: gridPos.x,
        y: gridPos.y,
        terrain: selectedTool.terrainType,
        color: getTerrainColor(selectedTool.terrainType)
      });
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const gridPos = getGridPosition(event);
    if (!gridPos) return;

    if (selectedTool?.type === 'select') {
      // Handle selection tools
      if (selectedTool.id === 'rectangle-select') {
        setSelectionMode('rectangle');
        setIsSelecting(true);
        setSelectionStart(gridPos);
        setSelectionEnd(gridPos);
      } else if (selectedTool.id === 'lasso-select') {
        setSelectionMode('lasso');
        setIsSelecting(true);
        // For now, treat lasso as rectangle selection
        setSelectionStart(gridPos);
        setSelectionEnd(gridPos);
      } else {
        // Regular select tool - clear selection if clicking empty space
        if (!event.ctrlKey && !event.metaKey) {
          clearSelection();
        }
      }
    } else if (selectedTool?.type === 'terrain') {
      setIsPainting(true);
      paintTerrain(gridPos);
    } else if (selectedTool?.type === 'entity' && selectedTool.entityType) {
      const newEntity: MapEntity = {
        id: `entity-${Date.now()}`,
        name: `New ${selectedTool.entityType}`,
        position: gridPos,
        type: selectedTool.entityType,
        size: 1,
        color: getEntityColor(selectedTool.entityType)
      };
      addEntityWithHistory(newEntity);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const gridPos = getGridPosition(event);
    setHoveredCell(gridPos);

    if (isPainting && gridPos && selectedTool?.type === 'terrain') {
      paintTerrain(gridPos);
    }

    if (isSelecting && gridPos && selectionStart) {
      setSelectionEnd(gridPos);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPainting(false);

    if (isSelecting && selectionStart && selectionEnd) {
      selectInRectangle(selectionStart, selectionEnd);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredCell(null);
    setIsPainting(false);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const renderGrid = () => {
    const lines = [];
    const { width: mapWidth, height: mapHeight, gridSize } = currentMap;

    // Vertical lines
    for (let i = 0; i <= mapWidth; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-300"
          style={{
            left: i * gridSize,
            top: 0,
            width: 1,
            height: mapHeight * gridSize
          }}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= mapHeight; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-300"
          style={{
            left: 0,
            top: i * gridSize,
            width: mapWidth * gridSize,
            height: 1
          }}
        />
      );
    }

    return lines;
  };

  const renderTerrain = () => {
    return currentMap.terrain.map((cell, index) => (
      <div
        key={`terrain-${index}`}
        className="absolute opacity-70 pointer-events-none"
        style={{
          left: cell.x * currentMap.gridSize,
          top: cell.y * currentMap.gridSize,
          width: currentMap.gridSize,
          height: currentMap.gridSize,
          backgroundColor: cell.color || getTerrainColor(cell.terrain!)
        }}
        title={`${cell.terrain} terrain`}
      />
    ));
  };

  const renderSelectedCells = () => {
    return selectedCells.map((cell, index) => (
      <div
        key={`selected-${index}`}
        className="absolute pointer-events-none border-2 border-blue-500"
        style={{
          left: cell.x * currentMap.gridSize,
          top: cell.y * currentMap.gridSize,
          width: currentMap.gridSize,
          height: currentMap.gridSize,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          zIndex: 999
        }}
      />
    ));
  };

  const renderSelectionRectangle = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return null;

    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);

    return (
      <div
        className="absolute pointer-events-none border-2 border-dashed border-blue-600"
        style={{
          left: minX * currentMap.gridSize,
          top: minY * currentMap.gridSize,
          width: (maxX - minX + 1) * currentMap.gridSize,
          height: (maxY - minY + 1) * currentMap.gridSize,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          zIndex: 1001
        }}
      />
    );
  };

  const renderHoverHighlight = () => {
    if (!hoveredCell || !selectedTool) return null;

    let highlightColor = 'rgba(0, 0, 0, 0.1)';
    let borderColor = '#666';

    if (selectedTool.type === 'terrain') {
      if (selectedTool.id === 'erase') {
        highlightColor = 'rgba(255, 0, 0, 0.2)';
        borderColor = '#ff0000';
      } else if (selectedTool.terrainType) {
        const terrainColor = getTerrainColor(selectedTool.terrainType);
        highlightColor = terrainColor + '40'; // Add alpha
        borderColor = terrainColor;
      }
    } else if (selectedTool.type === 'entity') {
      highlightColor = 'rgba(0, 255, 0, 0.2)';
      borderColor = '#00ff00';
    } else if (selectedTool.type === 'select') {
      highlightColor = 'rgba(59, 130, 246, 0.1)';
      borderColor = '#3b82f6';
    }

    return (
      <div
        className="absolute pointer-events-none border-2 border-dashed"
        style={{
          left: hoveredCell.x * currentMap.gridSize,
          top: hoveredCell.y * currentMap.gridSize,
          width: currentMap.gridSize,
          height: currentMap.gridSize,
          backgroundColor: highlightColor,
          borderColor: borderColor,
          zIndex: 1000
        }}
      />
    );
  };

  const renderEntities = () => {
    return currentMap.entities.map((entity) => (
      <div
        key={entity.id}
        className="absolute rounded-full flex items-center justify-center text-white font-bold text-xs cursor-pointer"
        style={{
          left: entity.position.x * currentMap.gridSize + 2,
          top: entity.position.y * currentMap.gridSize + 2,
          width: currentMap.gridSize - 4,
          height: currentMap.gridSize - 4,
          backgroundColor: entity.color
        }}
        title={entity.name}
      >
        {entity.name.charAt(0).toUpperCase()}
      </div>
    ));
  };

  const getCursorStyle = () => {
    if (!selectedTool) return 'default';

    switch (selectedTool.type) {
      case 'terrain':
        return selectedTool.id === 'erase' ? 'crosshair' : 'crosshair';
      case 'entity':
        return 'copy';
      case 'select':
        return 'pointer';
      default:
        return 'default';
    }
  };

  return (
    <div className="border border-gray-300 bg-white overflow-hidden" style={{ width, height }}>
      <div
        className="relative select-none"
        style={{
          width: currentMap.width * currentMap.gridSize,
          height: currentMap.height * currentMap.gridSize,
          backgroundColor: currentMap.background || '#ffffff',
          cursor: getCursorStyle()
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
      >
        {/* Grid */}
        {renderGrid()}

        {/* Terrain */}
        {renderTerrain()}

        {/* Entities */}
        {renderEntities()}

        {/* Selected Cells */}
        {renderSelectedCells()}

        {/* Selection Rectangle */}
        {renderSelectionRectangle()}

        {/* Hover Highlight */}
        {renderHoverHighlight()}
      </div>
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
