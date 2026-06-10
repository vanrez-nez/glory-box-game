import * as THREE from 'three/webgpu';
import GamePhysicsBody from '@/game/physics/physics-body';

/*
  A point-prop attached to the cylinder terrain (collectible, dragon den, …).
  Map-derived by colour and instantiated per chunk via the prop registry. The
  chunk machinery (map-chunk.ts) positions/saves props through `body` + the
  optional `state`, and toggles their display via `group`.
*/
export interface CylinderProp {
  // Visual container added to / removed from the map group with the chunk.
  group: THREE.Group;
  // Sensor body carrying the prop's map-space position; the chunk keys default
  // positions and per-chunk Y translation on it.
  body: GamePhysicsBody;
  // Optional persistent state (e.g. collectible `consumed`), saved across chunk
  // load/unload by GameObjectState.
  state?: { id: string; read(): any; write(s: any): any };
  // Place the prop at a map-space position (chunk translation calls this).
  setPosition(p: THREE.Vector2): void;
  // Per-frame update (animations); optional.
  update?(delta: number): void;
}
