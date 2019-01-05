import { PAUSE_GAME } from '@/store/modules/game';
import { EVENTS } from '@/game/const';

const DEFAULT = {
  store: null,
  map: null,
  enemy: null,
};

export default class GameState {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.restart();
    this.attachEvents();
  }

  onStoreMutation(mutationType, callback) {
    const { store } = this.opts;
    store.subscribe((mutation, state) => {
      if (mutation.type === mutationType) {
        callback(mutation.payload, state);
      }
    });
  }

  attachEvents() {
    const { map, enemy } = this.opts;
    map.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
    enemy.rayEvents.on(EVENTS.EnemyRayHit, this.onEnemyRayHit.bind(this));
    enemy.dragonEvents.on(EVENTS.EnemyDragonHit, this.onDragonHit.bind(this));
    this.onStoreMutation(PAUSE_GAME, this.onPauseMutation.bind(this));
  }

  onPauseMutation(state) {
    const { events } = this;
    if (state === false) {
      events.emit(EVENTS.GameResume);
    }
  }

  onEnemyRayHit() {
    this.deaths += 1;
    this.events.emit(EVENTS.PlayerDeath);
  }

  onDragonHit() {
    this.deaths += 1;
    this.events.emit(EVENTS.PlayerDeath);
  }

  onCollectiblePickup(collectible) {
    this.addPower();
    this.events.emit(EVENTS.CollectiblePickup, collectible);
  }

  addPower() {
    this.attackPower += 1;
  }

  restart() {
    this.deaths = 0;
    this.attackPower = 0;
    this.collectHistory = [];
  }

  get paused() {
    const { store } = this.opts;
    return store.state.game.paused;
  }

  set paused(value) {
    const { store } = this.opts;
    if (this.paused !== value) {
      store.commit(PAUSE_GAME, value);
    }
  }
}
