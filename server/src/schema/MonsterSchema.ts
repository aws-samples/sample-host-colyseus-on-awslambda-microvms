import { Schema, type } from '@colyseus/schema';

export class MonsterSchema extends Schema {
  @type('string') id: string = '';
  @type('string') templateId: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('number') health: number = 0;
  @type('number') maxHealth: number = 0;
  @type('string') state: string = 'idle';
  @type('number') spawnX: number = 0;
  @type('number') spawnZ: number = 0;
  @type('boolean') isElite: boolean = false;
}
