import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateMapSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  width: z.number().min(1).max(100).optional(),
  height: z.number().min(1).max(100).optional(),
  gridSize: z.number().min(10).max(100).optional(),
  background: z.string().optional(),
  terrain: z.array(z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.string(),
    color: z.string().optional()
  })).optional(),
  entities: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    type: z.string(),
    size: z.number(),
    color: z.string(),
    imageUrl: z.string().optional(),
    hp: z.number().optional(),
    maxHp: z.number().optional(),
    ac: z.number().optional(),
    speed: z.number().optional()
  })).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const map = await prisma.battleMap.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(map);
  } catch (error) {
    console.error('Failed to fetch map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map' },
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
    const data = UpdateMapSchema.parse(body);

    // Check if map exists
    const existingMap = await prisma.battleMap.findUnique({
      where: { id: params.id }
    });

    if (!existingMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Update map
    const updatedMap = await prisma.battleMap.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.width && { width: data.width }),
        ...(data.height && { height: data.height }),
        ...(data.gridSize && { gridSize: data.gridSize }),
        ...(data.background !== undefined && { background: data.background }),
        
        // Update terrain if provided
        ...(data.terrain && {
          terrain: {
            deleteMany: {},
            create: data.terrain.map((t) => ({
              x: t.x,
              y: t.y,
              type: t.terrain as any,
              color: t.color
            }))
          }
        }),
        
        // Update entities if provided
        ...(data.entities && {
          entities: {
            deleteMany: {},
            create: data.entities.map((e) => ({
              name: e.name,
              x: e.position.x,
              y: e.position.y,
              type: e.type as any,
              size: e.size,
              color: e.color,
              imageUrl: e.imageUrl,
              hp: e.hp,
              maxHp: e.maxHp,
              ac: e.ac,
              speed: e.speed
            }))
          }
        })
      },
      include: {
        terrain: true,
        entities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedMap);
  } catch (error) {
    console.error('Failed to update map:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update map' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if map exists
    const existingMap = await prisma.battleMap.findUnique({
      where: { id: params.id }
    });

    if (!existingMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Delete map (cascade will handle terrain and entities)
    await prisma.battleMap.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete map:', error);
    return NextResponse.json(
      { error: 'Failed to delete map' },
      { status: 500 }
    );
  }
}
