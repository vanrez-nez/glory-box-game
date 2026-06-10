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
  // Handles returned by store.subscribe so we can detach on dispose — the Vuex
  // store is a long-lived singleton that outlives the game, so leaving these
  // attached leaks a listener (and a reference to this GameState) per game.
  storeSubscriptions: Array<() => void> = [];
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.restart();
    this.attachEvents();
  }

  onStoreMutation(mutationType: any, callback: any) {
    const { store } = this.opts;
    const unsubscribe = store.subscribe((mutation: any, state: any) => {
      if (mutation.type === mutationType) {
        callback(mutation.payload, state);
      }
    });
    this.storeSubscriptions.push(unsubscribe);
  }

  dispose() {
    this.storeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.storeSubscriptions = [];
    this.events.removeAllListeners();
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
