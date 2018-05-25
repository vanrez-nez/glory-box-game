import { EVENTS } from './const';

const DEFAULT = {
  engine: null,
  player: null,
  enemy: null,
  word: null,
  map: null,
};

export default class GameSfxManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.attachEvents();
  }

  attachEvents() {
    const { map } = this.opts;
    map.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
  }

  onCollectiblePickup(collectible) {
    const { world, enemy } = this.opts;
    if (this.collectiblePickTimeline) {
      this.collectiblePickTimeline.kill();
    }
    const tl = new TimelineMax({});
    collectible.startTracerMode(enemy.head);
    collectible.itemMesh.visible = false;
    world.addCylinderBurstTweens(tl, collectible.body.position, collectible.color);
    this.collectiblePickTimeline = tl;
  }
}
