'use client';

import React, { useEffect, useState } from 'react';
import { useBattleMapStore } from '@/store/battle-map-store';
import { useSocket } from '@/hooks/useSocket';
import { useSessionPermissions } from '@/hooks/useSessionPermissions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import BattleMapCanvas from './BattleMapCanvas';
import Toolbar from './Toolbar';
import EntityPanel from './EntityPanel';
import ParticipantList from '../session/ParticipantList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Download, Upload, Play, Settings, Shield, Users, Eye } from 'lucide-react';
import { SessionData, Role, UserPresence } from '@/types/session';
import { BattleMapData } from '@/types/battle-map';

interface BattleMapEditorProps {
  mapId?: string;
  sessionId?: string;
  userId?: string;
  session?: SessionData;
  userRole?: Role | null;
}

export default function BattleMapEditor({
  mapId,
  sessionId,
  userId,
  session,
  userRole
}: BattleMapEditorProps) {
  const { currentMap, setCurrentMap } = useBattleMapStore();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isSaving, setIsSaving] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Session permissions
  const { permissions, isDM, validateMapEdit, validateEntityMove } = useSessionPermissions({
    userRole: userRole || null,
    isSessionOwner: session?.map?.owner?.id === userId
  });

  // Socket connection for real-time updates
  const socket = sessionId && userId ? useSocket({
    sessionId,
    userId,
    displayName: session?.participants.find(p => p.userId === userId)?.displayName,
    onMapUpdate: (mapData, updatedBy) => {
      if (updatedBy !== userId) {
        setCurrentMap(mapData);
      }
    },
    onEntityMove: (entityId, position, movedBy) => {
      if (movedBy !== userId) {
        // Handle real-time entity movement from other users
        // Update entity position in store
        // TODO: Implement entity position update in store
      }
    },
    onTerrainUpdate: (terrain, updatedBy) => {
      if (updatedBy !== userId) {
        // Handle terrain updates from other users
        // TODO: Implement terrain update in store
      }
    },
    onUserJoined: (user) => {
      setConnectedUsers(prev => [...prev.filter(u => u.userId !== user.userId), user]);
    },
    onUserLeft: (userId) => {
      setConnectedUsers(prev => prev.filter(u => u.userId !== userId));
    },
    onPermissionDenied: (action, reason) => {
      setPermissionError(`Permission denied: ${reason}`);
      setTimeout(() => setPermissionError(null), 5000);
    },
    onSessionState: (state) => {
      setConnectedUsers(state.connectedUsers || []);
    }
  }) : null;

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

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
      const panel = 320; // Entity panel width
      const padding = 40;
      
      setCanvasSize({
        width: Math.max(400, window.innerWidth - sidebar - panel - padding),
        height: Math.max(300, window.innerHeight - 120) // Header and padding
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
        const mapData = await response.json();
        // Convert database format to store format
        const convertedMap = {
          id: mapData.id,
          name: mapData.name,
          width: mapData.width,
          height: mapData.height,
          gridSize: mapData.gridSize,
          background: mapData.background,
          terrain: mapData.terrain.map((t: any) => ({
            x: t.x,
            y: t.y,
            terrain: t.type,
            color: t.color
          })),
          entities: mapData.entities.map((e: any) => ({
            id: e.id,
            name: e.name,
            position: { x: e.x, y: e.y },
            type: e.type,
            size: e.size,
            color: e.color,
            imageUrl: e.imageUrl,
            hp: e.hp,
            maxHp: e.maxHp,
            ac: e.ac,
            speed: e.speed
          }))
        };
        setCurrentMap(convertedMap);
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  };

  const saveMap = async () => {
    if (!currentMap) return;

    // Check permissions for map editing
    const validation = validateMapEdit();
    if (!validation.allowed) {
      setPermissionError(validation.reason || 'Cannot save map');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentMap,
          ownerId: userId || 'temp-user-id'
        })
      });

      if (response.ok) {
        // Emit map update to other users if in session
        if (socket) {
          socket.emitMapUpdate(currentMap);
        }
      }
    } catch (error) {
      console.error('Failed to save map:', error);
      setPermissionError('Failed to save map');
    } finally {
      setIsSaving(false);
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

  const handleEntityMove = (entityId: string, position: any) => {
    if (socket) {
      socket.emitEntityMove(entityId, position);
    }
  };

  if (!currentMap) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Permission Error Alert */}
        {permissionError && (
          <Alert variant="destructive" className="m-4 mb-0">
            <Shield className="h-4 w-4" />
            <AlertDescription>{permissionError}</AlertDescription>
          </Alert>
        )}

        {/* Session Status Bar */}
        {sessionId && session && (
          <div className="bg-blue-50 border-b border-blue-200 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  Session: {session.name}
                </span>
                <span className="text-xs text-blue-700">
                  Role: {userRole === 'DM' ? 'Dungeon Master' : userRole || 'Observer'}
                </span>
                <span className="text-xs text-blue-700">
                  {connectedUsers.filter(u => u.isConnected).length} online
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-blue-700 border-blue-300"
              >
                <Users className="h-4 w-4 mr-1" />
                Participants
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={currentMap.name}
              onChange={(e) => {
                if (permissions.canEditMap) {
                  setCurrentMap({ ...currentMap, name: e.target.value });
                }
              }}
              className="text-lg font-medium max-w-md"
              disabled={!permissions.canEditMap}
            />
            {sessionId && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Live Session
                </span>
                {!permissions.canEditMap && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    View Only
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={saveMap}
              size="sm"
              disabled={isSaving || !permissions.canEditMap}
            >
              <Save size={16} className="mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
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
            
            {!sessionId && (
              <Button onClick={startSession} className="bg-green-600 hover:bg-green-700">
                <Play size={16} className="mr-1" />
                Start Session
              </Button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4">
          <BattleMapCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            onEntityMove={handleEntityMove}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Participants Panel (if in session) */}
        {sessionId && session && showParticipants && (
          <div className="border-b border-gray-200">
            <ParticipantList
              participants={session.participants}
              connectedUsers={connectedUsers}
              currentUserId={userId || ''}
              currentUserRole={userRole || null}
              onUpdateRole={socket?.emitUpdateRole}
              onKickParticipant={socket?.emitKickParticipant}
              className="border-0"
            />
          </div>
        )}

        {/* Entity Panel */}
        <div className="flex-1">
          <EntityPanel />
        </div>
      </div>
    </div>
  );
}
