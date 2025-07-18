'use client';

import React, { useState } from 'react';
import { useBattleMapStore } from '@/store/battle-map-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapEntity } from '@/types/battle-map';
import { Edit, Trash2, Plus } from 'lucide-react';

export default function EntityPanel() {
  const { 
    currentMap, 
    selectedEntity, 
    setSelectedEntity, 
    updateEntity, 
    removeEntity 
  } = useBattleMapStore();
  
  const [editingEntity, setEditingEntity] = useState<MapEntity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!currentMap) return null;

  const handleEditEntity = (entity: MapEntity) => {
    setEditingEntity({ ...entity });
    setIsDialogOpen(true);
  };

  const handleSaveEntity = () => {
    if (editingEntity) {
      updateEntity(editingEntity.id, editingEntity);
      setEditingEntity(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeleteEntity = (entityId: string) => {
    removeEntity(entityId);
    if (selectedEntity?.id === entityId) {
      setSelectedEntity(null);
    }
  };

  const handleEntityClick = (entity: MapEntity) => {
    setSelectedEntity(entity);
  };

  return (
    <div className="bg-white border-l border-gray-200 p-4 w-80 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Entities</h3>
          <span className="text-sm text-gray-500">
            {currentMap.entities.length} total
          </span>
        </div>

        {/* Entity List */}
        <div className="space-y-2">
          {currentMap.entities.map((entity) => (
            <Card 
              key={entity.id}
              className={`cursor-pointer transition-colors ${
                selectedEntity?.id === entity.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleEntityClick(entity)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: entity.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entity.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entity.type} • ({entity.position.x}, {entity.position.y})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEntity(entity);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntity(entity.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                {/* Entity Stats */}
                {(entity.hp !== undefined || entity.ac !== undefined) && (
                  <div className="mt-2 text-xs text-gray-600">
                    {entity.hp !== undefined && (
                      <span>HP: {entity.hp}/{entity.maxHp || entity.hp}</span>
                    )}
                    {entity.ac !== undefined && (
                      <span className="ml-2">AC: {entity.ac}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Entity Details */}
        {selectedEntity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Entity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>{selectedEntity.name}</strong>
              </div>
              <div className="text-xs text-gray-600">
                Type: {selectedEntity.type}
              </div>
              <div className="text-xs text-gray-600">
                Position: ({selectedEntity.position.x}, {selectedEntity.position.y})
              </div>
              {selectedEntity.hp !== undefined && (
                <div className="text-xs text-gray-600">
                  HP: {selectedEntity.hp}/{selectedEntity.maxHp || selectedEntity.hp}
                </div>
              )}
              {selectedEntity.ac !== undefined && (
                <div className="text-xs text-gray-600">
                  AC: {selectedEntity.ac}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Entity Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Entity</DialogTitle>
            </DialogHeader>
            
            {editingEntity && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editingEntity.name}
                    onChange={(e) => setEditingEntity({
                      ...editingEntity,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">HP</label>
                    <Input
                      type="number"
                      value={editingEntity.hp || ''}
                      onChange={(e) => setEditingEntity({
                        ...editingEntity,
                        hp: parseInt(e.target.value) || undefined
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max HP</label>
                    <Input
                      type="number"
                      value={editingEntity.maxHp || ''}
                      onChange={(e) => setEditingEntity({
                        ...editingEntity,
                        maxHp: parseInt(e.target.value) || undefined
                      })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">AC</label>
                    <Input
                      type="number"
                      value={editingEntity.ac || ''}
                      onChange={(e) => setEditingEntity({
                        ...editingEntity,
                        ac: parseInt(e.target.value) || undefined
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Speed</label>
                    <Input
                      type="number"
                      value={editingEntity.speed || ''}
                      onChange={(e) => setEditingEntity({
                        ...editingEntity,
                        speed: parseInt(e.target.value) || undefined
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={editingEntity.color}
                    onChange={(e) => setEditingEntity({
                      ...editingEntity,
                      color: e.target.value
                    })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEntity}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
