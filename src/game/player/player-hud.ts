import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GetScreenCoords } from '@/common/three-utils';
import { GAME, EVENTS } from '@/game/const';
import GameSteeringTrailsSfx from '@/game/sfx/steering-trails-sfx';

const DEFAULT = {
  camera: null,
};

export default class GamePlayerHud {
  opts!: Record<string, any>;
  events!: EventEmitter3;
  group!: THREE.Group;
  trailsSfx!: any;
  fireball!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.group = new THREE.Group();
    this.trailsSfx = new GameSteeringTrailsSfx({
      parent: this.opts.camera,
    });
    this.loadModel();
    this.addFireballMesh();
    this.attachEvents();
  }

  attachEvents() {
    const { trailsSfx } = this;
    trailsSfx.events.on(EVENTS.SteeringTrailLanded, this.onSteeringTrailLanded.bind(this));
  }

  onSteeringTrailLanded(color: any) {
    this.events.emit(EVENTS.CollectibleCollect, color);
  }

  loadModel() {}

  addFireballMesh() {
    const geo = new THREE.SphereGeometry(0.4, 10, 10);
    const mat = MaterialFactory.getMaterial('PlayerHudFireball', {
      name: 'ph_fireball',
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.fireball = mesh;
    this.fireball.rotation.y = Math.PI;
    this.opts.camera.add(mesh);
  }

  addPowerCollectTweens(tl: any, amount: any, color: any) {
    const { fireball } = this;
    const { uniforms } = fireball.material;
    tl.to(fireball.scale, {
      duration: 0.15,
      x: 1.3,
      y: 1.3,
      z: 1.3,
      ease: 'back.out',
    });
    tl.to(fireball.scale, { duration: 0.2, x: 1, y: 1, z: 1 });
    tl.to(uniforms.u_glowIntensity.value, { duration: 0.3, x: 1.5, y: 2.5 }, 0);
    tl.to(uniforms.u_glowColor.value, {
      duration: 0.3,
      r: color.r,
      g: color.g,
      b: color.b,
    }, 0);
  }

  spawnTrailsFrom(positions: any, color: any) {
    this.trailsSfx.spawnTrailsFrom(positions, color);
  }

  resetPower(tl: any) {
    const { fireball } = this;
    tl.to(fireball.scale, {
      duration: 0.5,
      x: 1,
      y: 1,
      z: 1,
    });
  }

  update(delta: any) {
    const { camera } = this.opts;
    const { fireball } = this;
    const { uniforms } = fireball.material;
    const [x, y] = GetScreenCoords(0.5, 0.95, camera, GAME.HudDistanceFromCamera);
    fireball.position.set(x, y, -GAME.HudDistanceFromCamera);
    uniforms.u_time.value += delta * 0.15;
    this.trailsSfx.update(fireball.position);
  }
}
