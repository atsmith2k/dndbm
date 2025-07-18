import { z } from 'zod';

export const MapValidationSchema = z.object({
  name: z.string().min(1, 'Map name is required').max(100, 'Map name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  width: z.number().min(1, 'Width must be at least 1').max(100, 'Width too large'),
  height: z.number().min(1, 'Height must be at least 1').max(100, 'Height too large'),
  gridSize: z.number().min(10, 'Grid size too small').max(100, 'Grid size too large'),
  background: z.string().optional()
});

export const EntityValidationSchema = z.object({
  name: z.string().min(1, 'Entity name is required').max(50, 'Entity name too long'),
  type: z.enum(['PLAYER', 'NPC', 'MONSTER', 'OBJECT']),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0)
  }),
  size: z.number().min(1).max(10),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  hp: z.number().min(0).optional(),
  maxHp: z.number().min(0).optional(),
  ac: z.number().min(0).max(30).optional(),
  speed: z.number().min(0).max(200).optional()
});

export const SessionValidationSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(100, 'Session name too long'),
  mapId: z.string().min(1, 'Map ID is required')
});

export const ChatMessageValidationSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message too long'),
  type: z.enum(['chat', 'system', 'roll']).optional().default('chat')
});
