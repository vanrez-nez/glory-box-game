import { EVENTS } from './const';

const DEFAULT = {
  engine: null,
  player: null,
  word: null,
  map: null,
};

export default class GameSfxManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.attachEvents();
  }

  attachEvents() {
    const { engine, world, player, map } = this.opts;
    map.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
  }

  onCollectiblePickup(collectible) {
    const { world } = this.opts;
    if (this.collectiblePickTimeline) {
      this.collectiblePickTimeline.kill();
    }
    const tl = new TimelineMax({});
    world.addCylinderBurstTweens(tl, collectible.body.position, collectible.color);
    this.collectiblePickTimeline = tl;
  }
}
