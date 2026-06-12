import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { EVENTS } from '@/game/const';
import JobScheduler from '@/game/job-scheduler';
import GameEnemyRaySfx from '@/game/sfx/enemy-ray-sfx';

const DEFAULT = {
  parent: null,
  maxRays: 3,
};

export default class GameEnemyRays {
  opts!: Record<string, any>;
  lastRayTime!: number;
  rays!: any[];
  bodies!: any[];
  clock!: THREE.Timer;
  events!: EventEmitter3;
  scheduler!: any;
  // When true the editor has hidden the rays: skip ticking/firing entirely so the
  // per-ray update() can't re-show its mesh (it sets mesh.visible = running/frame).
  hidden = false;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.lastRayTime = 0;
    this.rays = [];
    this.bodies = [];
    this.clock = new THREE.Timer();
    this.events = new EventEmitter3();
    this.scheduler = new JobScheduler();
    this.initRays();
    this.attachEvents();
  }

  attachEvents() {
    const { rays } = this;
    rays.forEach(r => r.body.events.on(EVENTS.CollisionBegan,
      this.onEnemyRayCollision.bind(this, r)));
  }

  initRays() {
    const { bodies, rays, opts } = this;
    for (let i = 0; i < opts.maxRays; i++) {
      const sfx = new GameEnemyRaySfx({});
      sfx.mesh.scale.y = 100;
      rays.push(sfx);
      bodies.push(sfx.body);
      opts.parent.add(sfx.mesh);
    }
  }

  // Show/hide every ray (the editor hides them in edit mode). While hidden the
  // update loop is skipped, so an in-flight ray simply resumes when shown again.
  setVisible(visible: boolean) {
    this.hidden = !visible;
    this.rays.forEach((r: any) => { r.mesh.visible = false; });
  }

  onEnemyRayCollision(ray: any) {
    ray.body.enabled = false;
    this.events.emit(EVENTS.EnemyRayHit);
  }

  updateRays(delta: any, camera: any, playerPosition: any) {
    const { rays } = this;
    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      // update() first so mesh.position is current, then aim the billboard.
      ray.update(delta, playerPosition.y);
      if (ray.running) {
        // Face the camera HORIZONTALLY only (azimuth around Y) so the cylinder's
        // bright core (uv 0.5, the −Z side → +π) always points at the camera and
        // stays centred. lookAt() tilts with camera pitch and, once X/Z are zeroed,
        // leaves a corrupted Y that pushes the ray core off-centre.
        const m = ray.mesh;
        const az = Math.atan2(
          camera.position.x - m.position.x,
          camera.position.z - m.position.z,
        );
        m.rotation.set(0, az + Math.PI, 0);
      }
    }
  }

  fireRays(playerPosition: any) {
    const { clock, rays, scheduler } = this;
    const dt = clock.getElapsed() - this.lastRayTime;
    if (dt > 5) {
      const count = THREE.MathUtils.randInt(1, rays.length);
      const offsets = [0, -15, 15];
      for (let i = 0; i < count; i++) {
        const r = rays[i];
        if (r.running === false && !scheduler.jobExists(i)) {
          this.lastRayTime = clock.getElapsed();
          const posX = playerPosition.x + offsets[i];
          scheduler.addJob(i, () => {
            r.fire(posX);
          }, i * 0.4);
        }
      }
    }
  }

  restart() {
    // Timer's elapsed time accumulates and cannot be zeroed like Clock.start(),
    // so anchor lastRayTime to "now" to reset the fire cooldown instead.
    this.clock.update();
    this.lastRayTime = this.clock.getElapsed();
    this.scheduler.empty();
    this.rays.forEach(r => r.hide());
  }

  update(delta: any, camera: any, playerPosition: any) {
    if (this.hidden) { return; }
    this.clock.update();
    this.updateRays(delta, camera, playerPosition);
    this.fireRays(playerPosition);
    this.scheduler.update(delta);
  }
}
