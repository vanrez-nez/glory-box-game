import GameEnemyDragon from './enemy-dragon';
import GameEnemyRays from './enemy-rays';

const DEFAULT = {};

export default class GameEnemy {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameEnemy';
    this.dragon = new GameEnemyDragon({ parent: this.group });
    this.rays = new GameEnemyRays({ parent: this.group });
  }

  update(delta, camera, playerPosition) {
    this.dragon.update(delta);
    this.rays.update(delta, camera, playerPosition);
  }

  get rayEvents() {
    return this.rays.events;
  }

  get bodies() {
    return this.rays.bodies;
  }
}
