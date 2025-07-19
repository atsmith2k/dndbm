import { prisma } from './prisma';

// Environment variable validation and defaults
const SESSION_CONFIG = {
  maxDurationHours: parseInt(process.env.SESSION_MAX_DURATION_HOURS || '24'),
  maxParticipants: parseInt(process.env.SESSION_MAX_PARTICIPANTS || '8'),
  cleanupIntervalMinutes: parseInt(process.env.SESSION_CLEANUP_INTERVAL_MINUTES || '60'),
  enableRealtime: process.env.ENABLE_REALTIME !== 'false',
  joinRateLimit: parseInt(process.env.SESSION_JOIN_RATE_LIMIT || '10'),
};

/**
 * Generate a unique 6-character alphanumeric join code
 * Excludes confusing characters: 0, O, I, l, 1
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique join code that doesn't exist in the database
 */
export async function generateUniqueJoinCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateJoinCode();
    
    // Check if code already exists
    const existingSession = await prisma.session.findUnique({
      where: { joinCode: code }
    });

    if (!existingSession) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique join code after maximum attempts');
}

/**
 * Validate a join code format
 */
export function isValidJoinCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(session: { expiresAt: Date | null }): boolean {
  if (!session.expiresAt) return false;
  return new Date() > session.expiresAt;
}

/**
 * Calculate session expiration time (configurable hours from now)
 */
export function getSessionExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + SESSION_CONFIG.maxDurationHours);
  return expiration;
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActivity: new Date() }
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date()
          }
        },
        {
          lastActivity: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
          }
        }
      ]
    }
  });

  return result.count;
}

/**
 * Get session by join code with validation
 */
export async function getSessionByJoinCode(joinCode: string) {
  if (!isValidJoinCodeFormat(joinCode)) {
    throw new Error('Invalid join code format');
  }

  const session = await prisma.session.findUnique({
    where: { joinCode },
    include: {
      map: {
        include: {
          terrain: true,
          entities: true,
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      initiative: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (isSessionExpired(session)) {
    throw new Error('Session has expired');
  }

  return session;
}

/**
 * Check if user can join session
 */
export function canUserJoinSession(
  session: any,
  userId: string
): { canJoin: boolean; reason?: string } {
  // Check if session is active
  if (!session.isActive) {
    return { canJoin: false, reason: 'Session is not active' };
  }

  // Check if user is already in session
  const existingParticipant = session.participants.find(
    (p: any) => p.userId === userId
  );

  if (existingParticipant) {
    return { canJoin: true }; // Allow rejoining
  }

  // Check session capacity (configurable limit)
  if (session.participants.length >= SESSION_CONFIG.maxParticipants) {
    return { canJoin: false, reason: 'Session is full' };
  }

  return { canJoin: true };
}

/**
 * Role-based permission definitions
 */
export const ROLE_PERMISSIONS = {
  DM: {
    canEditMap: true,
    canMoveAnyEntity: true,
    canManageParticipants: true,
    canControlSession: true,
    canAssignCharacters: true,
    canKickUsers: true,
    canModifyTerrain: true,
    canManageInitiative: true,
    canMoveAssignedCharacter: true,
    canViewMap: true,
    canChat: true
  },
  PLAYER: {
    canEditMap: false,
    canMoveAnyEntity: false,
    canManageParticipants: false,
    canControlSession: false,
    canAssignCharacters: false,
    canKickUsers: false,
    canModifyTerrain: false,
    canManageInitiative: false,
    canMoveAssignedCharacter: true,
    canViewMap: true,
    canChat: true
  }
} as const;

export type Role = keyof typeof ROLE_PERMISSIONS;
export type Permission = keyof typeof ROLE_PERMISSIONS.DM;

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role][permission] === true;
}

/**
 * Get user's role in session
 */
export function getUserRole(
  session: any,
  userId: string
): Role | null {
  const participant = session.participants.find(
    (p: any) => p.userId === userId
  );
  
  return participant?.role as Role || null;
}

/**
 * Check if user can perform action in session
 */
export function canUserPerformAction(
  session: any,
  userId: string,
  permission: Permission
): boolean {
  const role = getUserRole(session, userId);
  if (!role) return false;
  
  return hasPermission(role, permission);
}
