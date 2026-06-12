import * as THREE from 'three/webgpu';
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
    // The ambient loops are spatialized on the dragon head — attached by the
    // dragon once its model has loaded (head doesn't exist synchronously here).
  }

  update(delta: any, camera: any, playerPosition: any, map: any) {
    this.dragon.update(delta, playerPosition, map);
    this.rays.update(delta, camera, playerPosition);
  }

  restart() {
    this.dragon.restart();
    this.rays.restart();
  }

  // Toggle the attack rays' visibility (the editor hides them in edit mode).
  setRaysVisible(visible: boolean) {
    this.rays.setVisible(visible);
  }

  get dragonEvents() {
    return this.dragon.events;
  }

  get rayEvents() {
    return this.rays.events;
  }
}
