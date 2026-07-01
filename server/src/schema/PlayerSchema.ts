import { Schema, type } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('number') health: number = 100;
  @type('number') maxHealth: number = 100;
  @type('number') mana: number = 50;
  @type('number') maxMana: number = 50;
  @type('number') level: number = 1;
  @type('string') anim: string = 'idle';
  @type('number') animTimer: number = 0;
  @type('string') scene: string = 'wilderness';
}
