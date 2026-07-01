export interface DamageEvent {
  id: string;
  targetId: string;
  amount: number;
  isCrit: boolean;
  position: [number, number, number];
  timestamp: number;
}
