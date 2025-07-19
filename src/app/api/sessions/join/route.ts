import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { 
  getSessionByJoinCode, 
  canUserJoinSession, 
  updateSessionActivity 
} from '@/lib/session-utils';

const JoinSessionSchema = z.object({
  joinCode: z.string().min(6).max(8),
  userId: z.string().optional(),
  displayName: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = JoinSessionSchema.parse(body);

    // Get session by join code
    const session = await getSessionByJoinCode(data.joinCode);

    // For now, require userId (in future, support guest users)
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user can join
    const { canJoin, reason } = canUserJoinSession(session, data.userId);
    if (!canJoin) {
      return NextResponse.json(
        { error: reason || 'Cannot join session' },
        { status: 403 }
      );
    }

    // Check if user already in session
    const existingParticipant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: data.userId
        }
      }
    });

    let participant;

    if (existingParticipant) {
      // Update existing participant (reconnection)
      participant = await prisma.sessionParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          isConnected: true,
          lastSeen: new Date(),
          ...(data.displayName && { displayName: data.displayName })
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } else {
      // Create new participant
      participant = await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          userId: data.userId,
          role: 'PLAYER', // Default role, DM can change later
          displayName: data.displayName,
          isConnected: true,
          lastSeen: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    }

    // Update session activity
    await updateSessionActivity(session.id);

    // Return session data with participant info
    const updatedSession = await prisma.session.findUnique({
      where: { id: session.id },
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

    return NextResponse.json({
      session: updatedSession,
      participant,
      message: existingParticipant ? 'Reconnected to session' : 'Joined session successfully'
    });

  } catch (error) {
    console.error('Failed to join session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Invalid join code' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Session has expired' },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate join code without joining
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const joinCode = searchParams.get('code');

    if (!joinCode) {
      return NextResponse.json(
        { error: 'Join code is required' },
        { status: 400 }
      );
    }

    const session = await getSessionByJoinCode(joinCode);

    // Return basic session info for validation
    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        name: session.name,
        mapName: session.map.name,
        participantCount: session.participants.length,
        isActive: session.isActive,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Failed to validate join code:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { valid: false, error: 'Invalid join code' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { valid: false, error: 'Session has expired' },
          { status: 410 }
        );
      }
    }

    return NextResponse.json(
      { valid: false, error: 'Failed to validate join code' },
      { status: 500 }
    );
  }
}
