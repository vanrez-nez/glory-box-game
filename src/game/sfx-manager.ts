import * as THREE from 'three';
import gsap from 'gsap';
import { GetScreenSize } from '@/common/three-utils';
import { EVENTS } from '@/game/const';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  gameState: null,
  playerHud: null,
  engine: null,
  player: null,
};

export default class GameSfxManager {
  opts!: Record<string, any>;
  fadeMesh!: THREE.Mesh;
  collectiblePickTimeline!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.initFadeMesh();
    this.attachEvents();
  }

  attachEvents() {
    const { gameState, playerHud } = this.opts;
    gameState.events.on(EVENTS.CollectiblePickup, this.onCollectiblePickup.bind(this));
    playerHud.events.on(EVENTS.CollectibleCollect, this.onCollectibleCollect.bind(this));
  }

  initFadeMesh() {
    const geo = new THREE.PlaneGeometry();
    const mat = MaterialFactory.getMaterial('GenericColor', {
      color: 0x0,
      depthWrite: false,
      transparent: true,
    });
    this.fadeMesh = new THREE.Mesh(geo, mat);
  }

  shakeCamera(tl: any, force: any) {
    const { cameraOffset } = this.opts.engine;
    const tween = tl.to({}, {
      duration: 0.1,
      onUpdate: () => {
        const intensity = 1 - tween.totalProgress();
        const x = Math.random() - 0.5 * 2;
        const y = Math.random() - 0.5 * 2;
        const z = Math.random() - 0.5 * 2;
        cameraOffset.set(x * intensity, y * intensity, z * intensity);
        cameraOffset.multiplyScalar(force);
      },
    });
  }

  fadeOut(tl: any, delay = 0) {
    const { fadeMesh } = this;
    const { camera } = this.opts.engine;
    tl.add(() => {
      const [w, h] = GetScreenSize(camera, 20);
      (fadeMesh.material as any).opacity = 0;
      camera.add(fadeMesh);
      fadeMesh.scale.set(w, h, 1.1);
      fadeMesh.position.z = -1.1;
    }, delay);
    tl.to(fadeMesh.material, {
      duration: 0.15,
      opacity: 1,
    });
  }

  fadeIn(tl: any, delay = 0) {
    const { fadeMesh } = this;
    tl.to(fadeMesh.material, {
      duration: 0.5,
      opacity: 0,
      delay,
    });
    tl.add(() => {
      if (fadeMesh.parent) {
        fadeMesh.parent.remove(fadeMesh);
      }
    });
  }

  destroyPlayer() {
    const { player } = this.opts;
    const tl = gsap.timeline();
    tl.add(() => {
      player.startExplodeSfx();
    });
    this.shakeCamera(tl, 40);
    tl.add(() => {
      player.hide();
    });
    this.fadeOut(tl, 1.5);
  }

  restart() {
    const tl = gsap.timeline();
    this.fadeIn(tl, 0);
  }

  onCollectibleCollect(color: any) {
    const { playerHud, gameState } = this.opts;
    const tl = gsap.timeline();
    playerHud.addPowerCollectTweens(tl, gameState.attackPower, color);
  }

  onCollectiblePickup(collectible: any) {
    const { world, playerHud } = this.opts;
    if (this.collectiblePickTimeline) {
      this.collectiblePickTimeline.kill();
    }
    const tl = gsap.timeline();
    // fire trails from collectible current position
    const trailPositions = collectible.getTrailPositions();
    playerHud.spawnTrailsFrom(trailPositions, collectible.color);
    world.addCylinderBurstTweens(tl, collectible.body.position, collectible.color);
    this.collectiblePickTimeline = tl;
  }
}
