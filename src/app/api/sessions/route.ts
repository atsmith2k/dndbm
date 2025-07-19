import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateUniqueJoinCode, getSessionExpiration } from '@/lib/session-utils';

const CreateSessionSchema = z.object({
  name: z.string().optional(),
  mapId: z.string(),
  userId: z.string(),
  expiresAt: z.string().datetime().optional()
});

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
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
        initiative: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateSessionSchema.parse(body);

    // Check if map exists and user owns it
    const map = await prisma.battleMap.findUnique({
      where: { id: data.mapId },
      include: {
        terrain: true,
        entities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!map) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Verify user owns the map (for now, allow any user to create sessions)
    // if (map.ownerId !== data.userId) {
    //   return NextResponse.json(
    //     { error: 'You can only create sessions for your own maps' },
    //     { status: 403 }
    //   );
    // }

    // Generate unique join code
    const joinCode = await generateUniqueJoinCode();

    // Set expiration time
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : getSessionExpiration();

    // Create session
    const session = await prisma.session.create({
      data: {
        name: data.name || `Session for ${map.name}`,
        mapId: data.mapId,
        joinCode,
        isActive: true,
        expiresAt,
        lastActivity: new Date()
      },
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
        initiative: true
      }
    });

    // Add the creator as DM
    await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId: data.userId,
        role: 'DM',
        isConnected: true,
        lastSeen: new Date()
      }
    });

    // Fetch updated session with participants
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
        initiative: true
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to create session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
