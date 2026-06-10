import * as THREE from 'three/webgpu';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import GameEnemyDragon from '@/game/enemy/enemy-dragon';
import GameEnemyRays from '@/game/enemy/enemy-rays';

const DEFAULT = {};

export default class GameEnemy {
  opts!: Record<string, any>;
  group!: THREE.Group;
  dragon!: any;
  rays!: any;
  bodies!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameEnemy';
    this.dragon = new GameEnemyDragon({ parent: this.group });
    this.rays = new GameEnemyRays({ parent: this.group });
    this.bodies = this.rays.bodies.concat(this.dragon.body);
    // These ambient loops were anchored to the (removed) vortex; keep them
    // spatialized on the dragon so the soundscape is preserved.
    AudioManager.setPositionalTrackParent('wind_loop', this.dragon.head);
    AudioManager.setPositionalTrackParent('dragon_near_loop', this.dragon.head);
  }

  update(delta: any, camera: any, playerPosition: any) {
    this.dragon.update(delta, playerPosition);
    this.rays.update(delta, camera, playerPosition);
  }

  restart() {
    this.dragon.restart();
    this.rays.restart();
  }

  get dragonEvents() {
    return this.dragon.events;
  }

  get rayEvents() {
    return this.rays.events;
  }
}
