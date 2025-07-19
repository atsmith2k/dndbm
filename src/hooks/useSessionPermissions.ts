import { useMemo } from 'react';
import { Role, SessionPermissions } from '@/types/session';
import { ROLE_PERMISSIONS, hasPermission, Permission } from '@/lib/session-utils';

interface UseSessionPermissionsProps {
  userRole: Role | null;
  isSessionOwner?: boolean;
  assignedCharacterId?: string;
}

export function useSessionPermissions({
  userRole,
  isSessionOwner = false,
  assignedCharacterId
}: UseSessionPermissionsProps) {
  
  const permissions = useMemo((): SessionPermissions => {
    if (!userRole) {
      // No role assigned - minimal permissions
      return {
        canEditMap: false,
        canMoveAnyEntity: false,
        canManageParticipants: false,
        canControlSession: false,
        canAssignCharacters: false,
        canKickUsers: false,
        canModifyTerrain: false,
        canManageInitiative: false,
        canMoveAssignedCharacter: false,
        canViewMap: true, // Allow viewing for observers
        canChat: true
      };
    }

    const basePermissions = ROLE_PERMISSIONS[userRole];
    
    return {
      canEditMap: basePermissions.canEditMap || isSessionOwner,
      canMoveAnyEntity: basePermissions.canMoveAnyEntity || isSessionOwner,
      canManageParticipants: basePermissions.canManageParticipants || isSessionOwner,
      canControlSession: basePermissions.canControlSession || isSessionOwner,
      canAssignCharacters: basePermissions.canAssignCharacters || isSessionOwner,
      canKickUsers: basePermissions.canKickUsers || isSessionOwner,
      canModifyTerrain: basePermissions.canModifyTerrain || isSessionOwner,
      canManageInitiative: basePermissions.canManageInitiative || isSessionOwner,
      canMoveAssignedCharacter: basePermissions.canMoveAssignedCharacter && !!assignedCharacterId,
      canViewMap: true, // All participants can view
      canChat: true // All participants can chat
    };
  }, [userRole, isSessionOwner, assignedCharacterId]);

  // Helper functions for common permission checks
  const canPerformAction = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission) || isSessionOwner;
  };

  const canMoveEntity = (entityId: string, entityType?: string): boolean => {
    // DMs can move any entity
    if (permissions.canMoveAnyEntity) return true;
    
    // Players can only move their assigned character
    if (permissions.canMoveAssignedCharacter && assignedCharacterId === entityId) {
      return true;
    }
    
    return false;
  };

  const canEditEntity = (entityId: string, entityType?: string): boolean => {
    // DMs can edit any entity
    if (permissions.canEditMap) return true;
    
    // Players might be able to edit their own character stats (future feature)
    // if (assignedCharacterId === entityId && entityType === 'PLAYER') {
    //   return true;
    // }
    
    return false;
  };

  const getPermissionLevel = (): 'admin' | 'player' | 'observer' => {
    if (!userRole) return 'observer';
    if (userRole === 'DM' || isSessionOwner) return 'admin';
    return 'player';
  };

  const getRoleDisplayName = (): string => {
    if (!userRole) return 'Observer';
    if (userRole === 'DM') return 'Dungeon Master';
    return 'Player';
  };

  const getRoleBadgeColor = (): string => {
    switch (getPermissionLevel()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'player': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'observer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionWarning = (action: string): string | null => {
    const level = getPermissionLevel();
    
    if (level === 'observer') {
      return `You need to be assigned a role to ${action}`;
    }
    
    if (level === 'player') {
      return `Only the Dungeon Master can ${action}`;
    }
    
    return null;
  };

  // Validation helpers
  const validateMapEdit = (): { allowed: boolean; reason?: string } => {
    if (permissions.canEditMap) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: getPermissionWarning('edit the map') || 'Insufficient permissions'
    };
  };

  const validateEntityMove = (entityId: string): { allowed: boolean; reason?: string } => {
    if (canMoveEntity(entityId)) {
      return { allowed: true };
    }
    
    if (permissions.canMoveAnyEntity) {
      return { allowed: true };
    }
    
    if (assignedCharacterId === entityId) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: 'You can only move your assigned character'
    };
  };

  const validateParticipantAction = (action: string): { allowed: boolean; reason?: string } => {
    if (permissions.canManageParticipants) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: getPermissionWarning(`${action} participants`) || 'Insufficient permissions'
    };
  };

  return {
    // Permission object
    permissions,
    
    // Role information
    userRole,
    permissionLevel: getPermissionLevel(),
    roleDisplayName: getRoleDisplayName(),
    roleBadgeColor: getRoleBadgeColor(),
    isSessionOwner,
    
    // Permission check functions
    canPerformAction,
    canMoveEntity,
    canEditEntity,
    
    // Validation functions
    validateMapEdit,
    validateEntityMove,
    validateParticipantAction,
    
    // Helper functions
    getPermissionWarning,
    
    // Quick access to common permissions
    isDM: userRole === 'DM' || isSessionOwner,
    isPlayer: userRole === 'PLAYER',
    isObserver: !userRole,
    hasAssignedCharacter: !!assignedCharacterId
  };
}

// Hook for checking specific permissions without full context
export function usePermissionCheck(userRole: Role | null, permission: Permission): boolean {
  return useMemo(() => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  }, [userRole, permission]);
}

// Hook for role-based UI styling
export function useRoleStyles(userRole: Role | null) {
  return useMemo(() => {
    switch (userRole) {
      case 'DM':
        return {
          badgeClass: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          borderColor: 'border-red-300',
          bgColor: 'bg-red-50'
        };
      case 'PLAYER':
        return {
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-300',
          bgColor: 'bg-blue-50'
        };
      default:
        return {
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-300',
          bgColor: 'bg-gray-50'
        };
    }
  }, [userRole]);
}
