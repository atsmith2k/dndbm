'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Crown, 
  User, 
  Eye, 
  MoreVertical, 
  UserMinus, 
  UserCheck,
  Circle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SessionParticipant, Role, UserPresence } from '@/types/session';
import { useSessionPermissions, useRoleStyles } from '@/hooks/useSessionPermissions';

interface ParticipantListProps {
  participants: SessionParticipant[];
  connectedUsers?: UserPresence[];
  currentUserId: string;
  currentUserRole: Role | null;
  onUpdateRole?: (userId: string, newRole: Role) => void;
  onAssignCharacter?: (userId: string, characterId: string) => void;
  onKickParticipant?: (userId: string) => void;
  className?: string;
}

export default function ParticipantList({
  participants,
  connectedUsers = [],
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onAssignCharacter,
  onKickParticipant,
  className = ''
}: ParticipantListProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  const { permissions } = useSessionPermissions({ 
    userRole: currentUserRole 
  });

  const getParticipantStatus = (participant: SessionParticipant) => {
    const presence = connectedUsers.find(u => u.userId === participant.userId);
    return {
      isConnected: presence?.isConnected || participant.isConnected,
      lastSeen: presence?.lastActivity || participant.lastSeen
    };
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'DM': return <Crown className="h-4 w-4" />;
      case 'PLAYER': return <User className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: Role) => {
    const styles = useRoleStyles(role);
    return (
      <Badge variant="outline" className={styles.badgeClass}>
        {getRoleIcon(role)}
        <span className="ml-1">
          {role === 'DM' ? 'DM' : role === 'PLAYER' ? 'Player' : 'Observer'}
        </span>
      </Badge>
    );
  };

  const getConnectionStatus = (isConnected: boolean) => {
    return isConnected ? (
      <div className="flex items-center text-green-600">
        <Circle className="h-2 w-2 fill-current mr-1" />
        <Wifi className="h-3 w-3" />
      </div>
    ) : (
      <div className="flex items-center text-gray-400">
        <Circle className="h-2 w-2 fill-current mr-1" />
        <WifiOff className="h-3 w-3" />
      </div>
    );
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    if (onUpdateRole && permissions.canManageParticipants) {
      onUpdateRole(userId, newRole);
    }
  };

  const handleKickParticipant = (userId: string) => {
    if (onKickParticipant && permissions.canKickUsers && userId !== currentUserId) {
      if (confirm('Are you sure you want to kick this participant?')) {
        onKickParticipant(userId);
      }
    }
  };

  const canManageParticipant = (participant: SessionParticipant) => {
    return permissions.canManageParticipants && participant.userId !== currentUserId;
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium">Participants ({participants.length})</h3>
        </div>
      </div>

      <div className="p-2">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {participants.map((participant) => {
              const status = getParticipantStatus(participant);
              const isCurrentUser = participant.userId === currentUserId;
              const canManage = canManageParticipant(participant);

              return (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    isCurrentUser ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getConnectionStatus(status.isConnected)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm truncate">
                          {participant.displayName || participant.user.name || 'Anonymous'}
                          {isCurrentUser && (
                            <span className="text-xs text-blue-600 ml-1">(You)</span>
                          )}
                        </p>
                        {getRoleBadge(participant.role as Role)}
                      </div>
                      
                      {participant.assignedCharacterId && (
                        <p className="text-xs text-gray-500 truncate">
                          Character: {participant.assignedCharacterId}
                        </p>
                      )}
                      
                      {!status.isConnected && (
                        <p className="text-xs text-gray-400">
                          Last seen: {new Date(status.lastSeen).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {permissions.canManageParticipants && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(participant.userId, 'DM')}
                              disabled={participant.role === 'DM'}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Make DM
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(participant.userId, 'PLAYER')}
                              disabled={participant.role === 'PLAYER'}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Make Player
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        
                        {onAssignCharacter && (
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Open character selection dialog
                              // onAssignCharacter?.(participant.userId, 'character-id');
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Character
                          </DropdownMenuItem>
                        )}
                        
                        {permissions.canKickUsers && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleKickParticipant(participant.userId)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Kick Participant
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {participants.length > 0 && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {connectedUsers.filter(u => u.isConnected).length} online
            </span>
            <span>
              {participants.filter(p => p.role === 'DM').length} DM, {' '}
              {participants.filter(p => p.role === 'PLAYER').length} Players
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
