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
    gameState.events.on(EVENTS.PlayerDeath, this.onPlayerDeath.bind(this));
    playerHud.events.on(EVENTS.CollectibleCollect, this.onCollectibleCollect.bind(this));
  }

  shakeCamera(force) {
    const { cameraOffset } = this.opts.engine;
    const tl = new TimelineMax();
    tl.to(cameraOffset, 0.05, {
      x: THREE.Math.randFloatSpread(force),
      y: THREE.Math.randFloatSpread(force),
      z: THREE.Math.randFloatSpread(force),
    });
    tl.to(cameraOffset, 0.05, { x: 0, y: 0, z: 0});
  }

  onPlayerDeath() {
    const { player } = this.opts;
    const tl = new TimelineMax();
    player.startExplodeSfx(tl);
    this.shakeCamera(4);
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
