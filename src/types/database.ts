import { BattleMap, Entity, Terrain, Session, User, SessionParticipant, InitiativeOrder } from '@prisma/client';

export type BattleMapWithRelations = BattleMap & {
  terrain: Terrain[];
  entities: Entity[];
  owner: Pick<User, 'id' | 'name' | 'email'>;
  sessions?: Session[];
};

export type SessionWithRelations = Session & {
  map: BattleMapWithRelations;
  participants: (SessionParticipant & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
  initiative: InitiativeOrder[];
};

export type EntityWithMap = Entity & {
  map: BattleMap;
};

export type TerrainWithMap = Terrain & {
  map: BattleMap;
};
