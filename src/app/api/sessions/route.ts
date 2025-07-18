import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateSessionSchema = z.object({
  name: z.string().optional(),
  mapId: z.string(),
  userId: z.string().optional()
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
    
    // Check if map exists
    const map = await prisma.battleMap.findUnique({
      where: { id: data.mapId },
      include: {
        terrain: true,
        entities: true
      }
    });

    if (!map) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        name: data.name || `Session for ${map.name}`,
        mapId: data.mapId,
        isActive: true
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

    return NextResponse.json(session);
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
