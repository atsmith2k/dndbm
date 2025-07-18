import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSessionSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  currentTurn: z.number().optional(),
  round: z.number().optional()
});

const JoinSessionSchema = z.object({
  userId: z.string(),
  role: z.enum(['DM', 'PLAYER']).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
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
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = UpdateSessionSchema.parse(body);

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.currentTurn !== undefined && { currentTurn: data.currentTurn }),
        ...(data.round !== undefined && { round: data.round })
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
        initiative: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to update session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete session (cascade will handle participants and initiative)
    await prisma.session.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// Join session endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = JoinSessionSchema.parse(body);

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user already in session
    const existingParticipant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: params.id,
          userId: data.userId
        }
      }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'User already in session' },
        { status: 400 }
      );
    }

    // Add user to session
    const participant = await prisma.sessionParticipant.create({
      data: {
        sessionId: params.id,
        userId: data.userId,
        role: data.role || 'PLAYER'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Failed to join session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
