import { EVENTS } from './const';

const DEFAULT = {
  gameState: null,
  playerHud: null,
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
    const { gameState, playerHud } = this.opts;
    gameState.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
    playerHud.events.on(EVENTS.CollectibleCollect, this.onCollectibleCollect.bind(this));
  }

  onCollectibleCollect(color) {
    const { playerHud, gameState } = this.opts;
    const tl = new TimelineMax();
    playerHud.addPowerCollectTweens(tl, gameState.attackPower, color);
  }

  onCollectiblePickup(collectible) {
    const { world, playerHud } = this.opts;
    if (this.collectiblePickTimeline) {
      this.collectiblePickTimeline.kill();
    }
    const tl = new TimelineMax({});
    // fire trails from collectible current position
    const trailPositions = collectible.getTrailPositions();
    playerHud.spawnTrailsFrom(trailPositions, collectible.color);
    world.addCylinderBurstTweens(tl, collectible.body.position, collectible.color);
    collectible.disable();
    this.collectiblePickTimeline = tl;
  }
}
