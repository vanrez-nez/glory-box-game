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
    this.bodies = this.rays.bodies.concat(this.dragon.body);
  }

  update(delta, camera, playerPosition) {
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
