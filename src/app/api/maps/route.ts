import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateMapSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  gridSize: z.number().min(10).max(100),
  background: z.string().optional(),
  ownerId: z.string().optional(),
  terrain: z.array(z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.string(),
    color: z.string().optional()
  })).optional(),
  entities: z.array(z.object({
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

export async function GET() {
  try {
    const maps = await prisma.battleMap.findMany({
      include: {
        terrain: true,
        entities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(maps);
  } catch (error) {
    console.error('Failed to fetch maps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateMapSchema.parse(body);

    // Create or get default user if no ownerId provided
    let ownerId = data.ownerId;
    if (!ownerId) {
      let defaultUser = await prisma.user.findFirst({
        where: { email: 'default@battlemap.local' }
      });

      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'default@battlemap.local',
            name: 'Default User'
          }
        });
      }
      ownerId = defaultUser.id;
    }

    // Create map with terrain and entities
    const map = await prisma.battleMap.create({
      data: {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        gridSize: data.gridSize,
        background: data.background,
        ownerId,
        terrain: {
          create: data.terrain?.map((t) => ({
            x: t.x,
            y: t.y,
            type: t.terrain as any, // TerrainType enum
            color: t.color
          })) || []
        },
        entities: {
          create: data.entities?.map((e) => ({
            name: e.name,
            x: e.position.x,
            y: e.position.y,
            type: e.type as any, // EntityType enum
            size: e.size,
            color: e.color,
            imageUrl: e.imageUrl,
            hp: e.hp,
            maxHp: e.maxHp,
            ac: e.ac,
            speed: e.speed
          })) || []
        }
      },
      include: {
        terrain: true,
        entities: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(map);
  } catch (error) {
    console.error('Failed to create map:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create map' },
      { status: 500 }
    );
  }
}
