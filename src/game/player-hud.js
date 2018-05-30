import { GAME, EVENTS } from './const';
import { GetScreenCoords } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import SteeringParticle from './steering-particle';
import LineTrail from './line-trail';

const DEFAULT = {
  camera: null,
};

const cachedVec = new THREE.Vector3();

export default class GamePlayerHud {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.group = new THREE.Group();
    this.trailsActive = false;
    this.tracers = [];
    this.loadModel();
    this.initTrails();
    this.addFireballMesh();
  }

  /* 
    Trails for collectible pickup sfx
  */
  initTrails() {
    const { camera } = this.opts;
    this.trails = [];
    for (let i = 0; i < 5; i++) {
      const trail = new LineTrail({
        maxPositions: 20,
        material: MaterialFactory.getMaterial('CollectibleTrail', {
          name: 'ph_trail',
          color: 0xffffff,
          lineWidth: 0.5,
        }, 'hud-trails'),
      });
      this.trails.push(trail);
      camera.add(trail.mesh);
    }
  }

  /* 
    Start trails sfx copying the given positions and color.
  */
  spawnTrailsFrom(positions, color) {
    const { camera } = this.opts;
    const { trails } = this;
    this.trailsActive = true;
    this.tracers = [];
    const rotStep = Math.PI / trails.length;
    for (let i = 0; i < trails.length; i++) {
      const trail = trails[i];
      const position = positions[i];
      trail.mesh.visible = true;
      const p = new SteeringParticle({});
      // Give a start acceleration to particle
      const x = Math.sin(rotStep * i) * 2;
      const y = Math.cos(rotStep * i) * 2;
      const z = 1;
      p.acceleration.set(x, y, z);
      // Translate position to local coords inside the camera
      camera.worldToLocal(position);
      p.position.copy(position);
      trail.resetPositionTo(position);
      trail.mesh.material.uniforms.color.value.setHex(color);
      this.tracers.push({
        trail,
        particle: p,
      });
    }
  }

  updateTrails() {
    const { tracers, fireball } = this;
    let idx = tracers.length;
    while (idx--) {
      const { trail, particle } = tracers[idx];
      cachedVec.copy(fireball.position);
      cachedVec.z -= 0.3;
      particle.update();
      particle.seek(cachedVec);
      if (particle.position.distanceTo(cachedVec) < 0.01) {
        trail.mesh.visible = false;
        tracers.splice(idx, 1);
        if (tracers.length === 0) {
          const { color } = trail.mesh.material.uniforms;
          this.emitCollectEvent(color.value.clone());
        }
      } else {
        trail.pushPosition(particle.position);
      }
    }
  }

  emitCollectEvent(color) {
    this.events.emit(EVENTS.CollectibleCollect, color);
  }

  loadModel() {
  }

  addFireballMesh() {
    const geo = new THREE.SphereBufferGeometry(0.6, 10, 10);
    const mat = MaterialFactory.getMaterial('PlayerHudFireball', {
      name: 'ph_fireball',
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.fireball = mesh;
    this.fireball.rotation.y += 1;
    this.opts.camera.add(mesh);
  }

  addPowerCollectTweens(tl, amount, color) {
    const { fireball } = this;
    const { uniforms } = fireball.material;
    tl.to(fireball.scale, 0.15, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      ease: Back.easeOut,
    });
    tl.to(fireball.scale, 0.2, { x: 1, y: 1, z: 1 });
    tl.to(uniforms.glowIntensity.value, 0.3, { x: 1.5, y: 2.5 }, 0);
    tl.to(uniforms.glowColor.value, 0.3, {
      r: color.r,
      g: color.g,
      b: color.b,
    }, 0);
  }

  resetPower(tl) {
    const { fireball } = this;
    tl.to(fireball.scale, 0.5, {
      x: 1,
      y: 1,
      z: 1,
    });
  }

  update(delta) {
    const { camera } = this.opts;
    const { fireball } = this;
    const { uniforms } = fireball.material;
    const [x, y] = GetScreenCoords(0.03, 0.5, camera, 20);
    fireball.position.set(x, y, -GAME.HudDistanceFromCamera);
    uniforms.time.value += delta * 0.15;
    this.updateTrails();
  }
}
