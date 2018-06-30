import { EVENTS } from '../const';
import JobScheduler from '../job-scheduler';
import GameEnemyRaySfx from '../sfx/enemy-ray-sfx';

const DEFAULT = {
  parent: null,
  maxRays: 3,
};

export default class GameEnemyRays {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.lastRayTime = 0;
    this.rays = [];
    this.bodies = [];
    this.clock = new THREE.Clock();
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

  onEnemyRayCollision(ray) {
    ray.body.enabled = false;
    this.events.emit(EVENTS.EnemyRayHit);
  }

  updateRays(delta, camera, playerPosition) {
    const { rays } = this;
    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      if (ray.running) {
        ray.mesh.lookAt(camera.position);
      }
      ray.update(delta, playerPosition.y);
    }
  }

  fireRays(playerPosition) {
    const { clock, rays, scheduler } = this;
    const dt = clock.getElapsedTime() - this.lastRayTime;
    if (dt > 5) {
      const count = THREE.Math.randInt(1, rays.length);
      const offsets = [0, -15, 15];
      for (let i = 0; i < count; i++) {
        const r = rays[i];
        if (r.running === false && !scheduler.jobExists(i)) {
          this.lastRayTime = clock.getElapsedTime();
          const posX = playerPosition.x + offsets[i];
          scheduler.addJob(i, () => {
            r.fire(posX);
          }, i * 0.4);
        }
      }
    }
  }

  restart() {
    this.lastRayTime = 0;
    this.clock.start();
    this.scheduler.empty();
    this.rays.forEach(r => r.hide());
  }

  update(delta, camera, playerPosition) {
    this.updateRays(delta, camera, playerPosition);
    this.fireRays(playerPosition);
    this.scheduler.update(delta);
  }
}
