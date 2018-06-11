import { EVENTS } from './const';
import { GetScreenSize } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

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
    this.initFadeMesh();
    this.attachEvents();
  }

  attachEvents() {
    const { gameState, playerHud } = this.opts;
    gameState.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
    gameState.events.on(EVENTS.PlayerDeath, this.onPlayerDeath.bind(this));
    playerHud.events.on(EVENTS.CollectibleCollect, this.onCollectibleCollect.bind(this));
  }

  initFadeMesh() {
    const geo = new THREE.PlaneBufferGeometry();
    const mat = MaterialFactory.getMaterial('GenericColor', {
      color: 0x0,
      transparent: true,
    });
    this.fadeMesh = new THREE.Mesh(geo, mat);
  }

  shakeCamera(tl, force) {
    const { cameraOffset } = this.opts.engine;
    tl.to(cameraOffset, 0.05, {
      x: THREE.Math.randFloatSpread(force),
      y: THREE.Math.randFloatSpread(force),
      z: THREE.Math.randFloatSpread(force),
    });
    tl.to(cameraOffset, 0.05, { x: 0, y: 0, z: 0 });
  }

  fadeOut(tl, delay = 0) {
    const { fadeMesh } = this;
    const { camera } = this.opts.engine;
    tl.add(() => {
      const [w, h] = GetScreenSize(camera, 20);
      fadeMesh.material.opacity = 0;
      camera.add(fadeMesh);
      fadeMesh.scale.set(w, h, 1.1);
      fadeMesh.position.z = -1.1;
    });
    tl.to(fadeMesh.material, 0.15, {
      opacity: 1,
      delay,
    });
  }

  fadeIn(tl, delay = 0) {
    const { fadeMesh } = this;
    tl.to(fadeMesh.material, 0.5, {
      opacity: 0,
      delay,
    });
    tl.add(() => {
      if (fadeMesh.parent) {
        fadeMesh.parent.remove(fadeMesh);
      }
    });
  }

  onPlayerDeath() {
    const { player } = this.opts;
    const tl = new TimelineMax();
    tl.add(() => {
      player.hide();
      player.startExplodeSfx();
    });
    this.shakeCamera(tl, 4);
    this.fadeOut(tl, 1);
    tl.add(() => {
      player.restore();
    });
    this.fadeIn(tl, 0.2);
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
