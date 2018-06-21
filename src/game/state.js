import { EVENTS } from './const';

const DEFAULT = {
  map: null,
};

export default class GameState {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.reset();
    this.attachEvents();
  }

  attachEvents() {
    const { map, enemy } = this.opts;
    map.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
    enemy.rayEvents.on(EVENTS.EnemyRayHit, this.onEnemyRayHit.bind(this));
  }

  onEnemyRayHit() {
    this.deaths += 1;
    //this.events.emit(EVENTS.PlayerDeath);
  }

  onCollectiblePickup(collectible) {
    this.addPower();
    this.events.emit(EVENTS.CollectiblePickup, collectible);
  }

  addPower() {
    this.attackPower += 1;
  }

  reset() {
    this.deaths = 0;
    this.attackPower = 0;
    this.collectHistory = [];
  }
}
