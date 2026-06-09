import EventEmitter3 from 'eventemitter3';
import { PAUSE_GAME } from '@/store/modules/game';
import { EVENTS } from '@/game/const';

const DEFAULT = {
  store: null,
  map: null,
  enemy: null,
};

export default class GameState {
  opts!: Record<string, any>;
  events!: EventEmitter3;
  deaths!: number;
  attackPower!: number;
  collectHistory!: any[];
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.restart();
    this.attachEvents();
  }

  onStoreMutation(mutationType: any, callback: any) {
    const { store } = this.opts;
    store.subscribe((mutation: any, state: any) => {
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

  onPauseMutation(state: any) {
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

  onCollectiblePickup(collectible: any) {
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
