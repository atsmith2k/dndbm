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
