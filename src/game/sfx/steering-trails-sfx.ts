import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { EVENTS } from '@/game/const';
import LineTrail from '@/game/line-trail';
import SteeringParticle from '@/game/sfx/common/steering-particle';

const cachedVec = new THREE.Vector3();
const cachedWorld = new THREE.Vector3();
const DEFAULT = {
  parent: null,
  camera: null,
};

export default class GameSteeringTrailsSfx {
  opts!: Record<string, any>;
  events!: EventEmitter3;
  tracers!: any[];
  active!: boolean;
  trails!: any[];
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.tracers = [];
    this.active = false;
    this.initTrails();
  }

  emitLandedEvent(color: any) {
    this.events.emit(EVENTS.SteeringTrailLanded, color);
  }

  /*
    Trails for collectible pickup sfx.

    PORT NOTE: the original three.meshline trails were parented to the camera and
    simulated in camera-local (HUD) space. makio-meshline does NOT rasterize a
    camera-parented MeshLine (the mesh ends up in the scene graph, visible and
    on-screen, but is never drawn — verified at runtime), while scene-parented
    MeshLines render fine. So we keep the original camera-local SIMULATION exactly,
    but parent the mesh to the scene and bake the live camera transform into the
    points every frame (bakeToWorld). Re-baking ALL points with the live camera
    reproduces the original camera-glued look (the whole streak tracks the camera
    into the fireball) while giving makio the world-space mesh it needs to draw.
  */
  initTrails() {
    const { parent } = this.opts;
    this.trails = [];
    for (let i = 0; i < 5; i++) {
      const trail = new LineTrail({
        maxPositions: 15,
        color: 0xffffff,
        lineWidth: 0.2,
      });
      this.trails.push(trail);
      parent.add(trail.mesh);
    }
  }

  // Bake a trail's camera-local point history into world space using the LIVE
  // camera matrix, then upload — keeps the streak glued to the HUD as the camera
  // moves while the mesh stays a (drawable) scene child.
  bakeToWorld(trail: any, localPts: Float32Array, camera: any) {
    const n = trail.opts.maxPositions;
    const out = trail.points;
    const m = camera.matrixWorld;
    for (let k = 0; k < n; k++) {
      const o = k * 3;
      cachedWorld.set(localPts[o], localPts[o + 1], localPts[o + 2]).applyMatrix4(m);
      out[o] = cachedWorld.x; out[o + 1] = cachedWorld.y; out[o + 2] = cachedWorld.z;
    }
    trail.mesh.setPositions(out, false);
  }

  /*
    Start trails sfx copying the given (world) positions and color. Same as the
    original: contact points are converted to camera-local space and the particle
    steers toward the fireball in that HUD space.
  */
  spawnTrailsFrom(positions: any, color: any) {
    const { camera } = this.opts;
    const { trails } = this;
    this.active = true;
    this.tracers = [];
    camera.updateMatrixWorld();
    const rotStep = Math.PI / trails.length;
    for (let i = 0; i < trails.length; i++) {
      const trail = trails[i];
      const worldPos = positions[i];
      if (!worldPos) { continue; }
      trail.mesh.visible = true;
      const p = new SteeringParticle({});
      // Give a start acceleration to particle
      const x = Math.sin(rotStep * i + 2) * THREE.MathUtils.randFloat(2, 5);
      const y = Math.cos(rotStep * i + 2) * THREE.MathUtils.randFloat(2, 5);
      const z = 1;
      p.acceleration.set(x, y, z);
      // World contact point -> camera-local (HUD) space (same as the original
      // parent.worldToLocal when parent was the camera).
      const local = camera.worldToLocal(worldPos.clone());
      p.position.copy(local);
      // Seed the camera-local history at the contact and bake to world once.
      const n = trail.opts.maxPositions;
      const localPts = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        localPts[k * 3] = local.x; localPts[k * 3 + 1] = local.y; localPts[k * 3 + 2] = local.z;
      }
      this.bakeToWorld(trail, localPts, camera);
      trail.mesh.color(color);
      this.tracers.push({ trail, particle: p, localPts });
    }
  }

  // targetPosition is the fireball's camera-local (HUD) position.
  update(targetPosition: any, camera: any) {
    const { tracers } = this;
    let idx = tracers.length;

    if (!this.active || !camera) {
      return;
    }
    camera.updateMatrixWorld();

    while (idx--) {
      const { trail, particle, localPts } = tracers[idx];
      cachedVec.copy(targetPosition);
      cachedVec.z -= 0.3;
      particle.update();
      particle.seek(cachedVec);
      if (particle.position.distanceTo(cachedVec) < 0.01) {
        trail.mesh.visible = false;
        tracers.splice(idx, 1);
        if (tracers.length === 0) {
          const color = (trail.mesh.material as any).color;
          this.emitLandedEvent(color.value.clone());
          this.active = false;
        }
      } else {
        // Advance the camera-local history (same as the old pushPosition, but in
        // HUD space) then re-bake the whole trail to world for rendering.
        localPts.copyWithin(0, 3);
        const last = (trail.opts.maxPositions - 1) * 3;
        localPts[last] = particle.position.x;
        localPts[last + 1] = particle.position.y;
        localPts[last + 2] = particle.position.z;
        this.bakeToWorld(trail, localPts, camera);
      }
    }
  }
}
