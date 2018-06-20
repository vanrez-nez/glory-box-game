import { EVENTS } from '../const';
import { MaterialFactoryInstance as MaterialFactory } from '../materials/material-factory';
import SteeringParticle from './common/steering-particle';
import LineTrail from '../line-trail';

const cachedVec = new THREE.Vector3();
const DEFAULT = {
  parent: null,
};

export default class GameSteeringTrailsSfx {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.tracers = [];
    this.active = false;
    this.initTrails();
  }

  emitLandedEvent(color) {
    this.events.emit(EVENTS.SteeringTrailLanded, color);
  }

  /*
    Trails for collectible pickup sfx
  */
  initTrails() {
    const { parent } = this.opts;
    this.trails = [];
    for (let i = 0; i < 5; i++) {
      const trail = new LineTrail({
        maxPositions: 15,
        material: MaterialFactory.getMaterial('GenericTrail', {
          name: 'ph_trail',
          color: 0xffffff,
          lineWidth: 0.2,
        }, 'hud-trails'),
      });
      this.trails.push(trail);
      parent.add(trail.mesh);
    }
  }

  /*
    Start trails sfx copying the given positions and color.
  */
  spawnTrailsFrom(positions, color) {
    const { parent } = this.opts;
    const { trails } = this;
    this.active = true;
    this.tracers = [];
    const rotStep = Math.PI / trails.length;
    for (let i = 0; i < trails.length; i++) {
      const trail = trails[i];
      const position = positions[i];
      trail.mesh.visible = true;
      const p = new SteeringParticle({});
      // Give a start acceleration to particle
      const x = Math.sin(rotStep * i + 2) * THREE.Math.randFloat(2, 5);
      const y = Math.cos(rotStep * i + 2) * THREE.Math.randFloat(2, 5);
      const z = 1;
      p.acceleration.set(x, y, z);
      // Translate position to local coords inside the parent
      parent.worldToLocal(position);
      p.position.copy(position);
      trail.resetPositionTo(position);
      trail.mesh.material.uniforms.color.value.setHex(color);
      this.tracers.push({
        trail,
        particle: p,
      });
    }
  }

  update(targetPosition) {
    const { tracers } = this;
    let idx = tracers.length;

    if (!this.active) {
      return;
    }

    while (idx--) {
      const { trail, particle } = tracers[idx];
      cachedVec.copy(targetPosition);
      cachedVec.z -= 0.3;
      particle.update();
      particle.seek(cachedVec);
      if (particle.position.distanceTo(cachedVec) < 0.01) {
        trail.mesh.visible = false;
        tracers.splice(idx, 1);
        if (tracers.length === 0) {
          const { color } = trail.mesh.material.uniforms;
          this.emitLandedEvent(color.value.clone());
          this.active = false;
        }
      } else {
        trail.pushPosition(particle.position);
      }
    }
  }
}
