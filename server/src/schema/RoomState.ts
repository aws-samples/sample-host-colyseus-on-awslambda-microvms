import { Schema, MapSchema, type } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema.js';
import { MonsterSchema } from './MonsterSchema.js';

export class RoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: MonsterSchema }) monsters = new MapSchema<MonsterSchema>();
  @type('number') elapsedTime: number = 0;
}
