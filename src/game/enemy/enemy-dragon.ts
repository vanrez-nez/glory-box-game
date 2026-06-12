import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GameConfigInstance as GameConfig, DRAGON } from '@/game/config';
import { GAME, PHYSICS } from '@/game/const';
import { EaseExpoOut } from '@/game/utils';
import LineTrail from '@/game/line-trail';
import GamePhysicsBody from '@/game/physics/physics-body';

const { lerp, clamp, smoothstep } = THREE.MathUtils;
const UP = new THREE.Vector3(0, 1, 0);

interface DragonOptions {
  parent: THREE.Object3D | null;
  tailSize: number;
}

const DEFAULT: DragonOptions = {
  parent: null,
  tailSize: 100,
};

// Radial depth (below the wall) the dragon sits at while hidden inside.
const HIDDEN_DEPTH = 9;
const TRAIL_MAX = 1500;
const HISTORY_MAX = 600;
// Debug-render sizing (spheres + cone). MAXR = body radius at the shoulders.
const MAXR = 0.7;

type DragonState = 'hidden' | 'emerging' | 'active' | 'diving';
type DragonBehavior = 'circle' | 'attack';
interface CylPoint { theta: number; y: number; }

/*
  Serpentine dragon: dives in and out of dens (hex holes), and on each appearance
  either circles past the player or holds an attack pose (body held off the wall,
  head curving in toward the player's recent path). The head rides a cylinder-space
  trajectory (theta, y, radius); the body breadcrumb-follows the head's world trail
  so it retraces the route (incl. the dive in/out, where radius < CylinderRadius
  hides it behind the wall). Collision is disabled.

  Rendering is currently a DEBUG representation — an InstancedMesh of spheres for
  the body and a cone for the head (so segment spacing and head direction are
  obvious). The GLTF mesh comes back once the movement is dialled in.
*/
export default class GameEnemyDragon {
  opts: DragonOptions;
  events: EventEmitter3;
  params: typeof DRAGON;
  modelLoaded: boolean;
  body: GamePhysicsBody;
  head!: THREE.Mesh;
  bodyMesh!: THREE.InstancedMesh;
  spine!: LineTrail;

  // --- head state (cylinder space) ---
  state: DragonState;
  behavior: DragonBehavior;
  phaseT: number;
  clock: number;
  theta: number;
  headY: number;
  radius: number;
  arcDist: number;
  waveT: number;
  attackBlend: number;
  emerge: CylPoint;
  target: CylPoint;
  exitTheta: number;
  exitY: number;

  // --- buffers ---
  trail: THREE.Vector3[];
  headPos: THREE.Vector3;
  D: THREE.Vector3[];
  playerHistory: { theta: number; y: number; t: number }[];

  // scratch
  private _seg = new THREE.Vector3();
  private _aim = new THREE.Vector3();
  private _fwd = new THREE.Vector3();
  private _dummy = new THREE.Object3D();

  constructor(opts: Partial<DragonOptions> = {}) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.params = { ...DRAGON };
    this.body = this.getBody();

    this.state = 'hidden';
    this.behavior = 'circle';
    this.phaseT = 0;
    this.clock = 0;
    this.theta = 0;
    this.headY = 0;
    this.radius = GAME.CylinderRadius - HIDDEN_DEPTH;
    this.arcDist = 0;
    this.waveT = 0;
    this.attackBlend = 0;
    this.emerge = { theta: 0, y: 0 };
    this.target = { theta: 0, y: 0 };
    this.exitTheta = 0;
    this.exitY = 0;

    this.trail = [];
    this.headPos = new THREE.Vector3();
    this.playerHistory = [];
    this.D = [];
    for (let i = 0; i < this.opts.tailSize; i++) {
      this.D.push(new THREE.Vector3());
    }

    this.initMeshes();
    this.modelLoaded = true;
  }

  // Sensor body kept for a future ray hook, but collision is off for now.
  getBody() {
    const body = new GamePhysicsBody({
      type: PHYSICS.EnemyDragon,
      isStatic: true,
      isSensor: true,
      scale: new THREE.Vector2(1, 1),
      label: 'enemy_dragon',
      collisionTargets: [],
    });
    body.enabled = false;
    return body;
  }

  initMeshes() {
    const { parent } = this.opts;
    // Body: instanced spheres (sized by the radius profile, no orientation).
    const sphereGeo = new THREE.SphereGeometry(1, 12, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2fae84, roughness: 0.45, metalness: 0.05,
      emissive: 0x0a3a2a, emissiveIntensity: 0.6,
    });
    this.bodyMesh = new THREE.InstancedMesh(sphereGeo, bodyMat, this.opts.tailSize);
    this.bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyMesh.frustumCulled = false;
    parent!.add(this.bodyMesh);

    // Head: a cone whose apex points along the travel/aim direction.
    const coneGeo = new THREE.ConeGeometry(0.95, 2.6, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xff7a3a, roughness: 0.4,
      emissive: 0x5a1e08, emissiveIntensity: 0.9,
    });
    this.head = new THREE.Mesh(coneGeo, headMat);
    this.head.frustumCulled = false;
    parent!.add(this.head);

    this.spine = new LineTrail({
      maxPositions: this.opts.tailSize,
      color: 0xffff00,
      lineWidth: 2,
      sizeFn: (t: number) => EaseExpoOut(t),
    });
    parent!.add(this.spine.mesh);

    AudioManager.setPositionalTrackParent('wind_loop', this.head);
    AudioManager.setPositionalTrackParent('dragon_near_loop', this.head);
  }

  restart() {
    this.state = 'hidden';
    this.phaseT = 0;
    this.attackBlend = 0;
    this.radius = GAME.CylinderRadius - HIDDEN_DEPTH;
    this.trail.length = 0;
    this.playerHistory.length = 0;
  }

  // --- helpers ---------------------------------------------------------------

  private worldFromCyl(out: THREE.Vector3, theta: number, y: number, radius: number) {
    out.set(radius * Math.sin(theta), y, radius * Math.cos(theta));
    return out;
  }

  private lerpAngle(a: number, b: number, t: number) {
    let d = b - a;
    while (d > Math.PI) { d -= Math.PI * 2; }
    while (d < -Math.PI) { d += Math.PI * 2; }
    return a + d * t;
  }

  private denThetaY(den: any): CylPoint {
    return { theta: den.body.position.x * GameConfig.ThetaPerUnit, y: den.body.position.y };
  }

  private outHeight() {
    return this.behavior === 'attack' ? this.params.bodySep : this.params.circleHeight;
  }

  // Sphere radius along the body. Debug profile: gentle linear taper only, so the
  // WHOLE body stays clearly visible (no rounded nose / no aggressive tail taper).
  private radiusAt(tn: number) {
    return MAXR * (1 - 0.55 * tn);
  }

  private chooseBehavior(): DragonBehavior {
    const f = this.params.forceBehavior;
    if (f === 1) { return 'circle'; }
    if (f === 2) { return 'attack'; }
    return Math.random() < this.params.attackWeight ? 'attack' : 'circle';
  }

  // A den's allowed direction ('both' default keeps legacy/map dens bidirectional).
  private denDir(den: any) {
    return den.opts?.direction ?? 'both';
  }

  // Emerge only from dens that allow it (input / both).
  private pickEmergeDen(map: any, playerY: number) {
    const dens = map.getActiveDens();
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < dens.length; i++) {
      if (this.denDir(dens[i]) === 'output') { continue; }
      const dy = Math.abs(dens[i].body.position.y - playerY);
      if (dy < bestD) { bestD = dy; best = dens[i]; }
    }
    return best;
  }

  // Dive only into dens that allow it (output / both).
  private pickTargetDen(map: any) {
    const dens = map.getActiveDens();
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < dens.length; i++) {
      if (this.denDir(dens[i]) === 'input') { continue; }
      const ty = this.denThetaY(dens[i]);
      let dth = Math.abs(this.lerpAngle(this.theta, ty.theta, 1) - this.theta);
      dth *= GAME.CylinderRadius;
      const dist = dth + Math.abs(ty.y - this.headY);
      if (dist < bestD) { bestD = dist; best = dens[i]; }
    }
    return best;
  }

  private samplePlayer(playerPos: any) {
    const theta = playerPos.x * GameConfig.ThetaPerUnit;
    this.playerHistory.push({ theta, y: playerPos.y, t: this.clock });
    if (this.playerHistory.length > HISTORY_MAX) { this.playerHistory.shift(); }
  }

  private getLaggedPlayer(): CylPoint | null {
    const h = this.playerHistory;
    if (!h.length) { return null; }
    const targetT = this.clock - this.params.aimLag;
    for (let i = 0; i < h.length; i++) {
      if (h[i].t >= targetT) { return h[i]; }
    }
    return h[h.length - 1];
  }

  private pushTrail(p: THREE.Vector3) {
    const { trail } = this;
    const last = trail[trail.length - 1];
    if (!last || last.distanceToSquared(p) > 1e-6) {
      trail.push(p.clone());
      if (trail.length > TRAIL_MAX) { trail.splice(0, trail.length - TRAIL_MAX); }
    }
  }

  // --- per-frame -------------------------------------------------------------

  private advanceState(delta: number, map: any, playerPos: any) {
    const p = this.params;
    this.phaseT += delta;
    const playerY = playerPos.y;

    switch (this.state) {
      case 'hidden': {
        this.radius = GAME.CylinderRadius - HIDDEN_DEPTH;
        this.attackBlend = lerp(this.attackBlend, 0, Math.min(1, delta * 4));
        if (this.phaseT >= p.hiddenDwell) {
          const den = this.pickEmergeDen(map, playerY);
          if (den) {
            this.emerge = this.denThetaY(den);
            this.theta = this.emerge.theta;
            this.headY = this.emerge.y;
            this.behavior = this.chooseBehavior();
            this.trail.length = 0;
            this.setState('emerging');
          } else {
            this.phaseT = 0; // no dens in range — keep waiting
          }
        }
        break;
      }
      case 'emerging': {
        const t = clamp(this.phaseT / p.emergeTime, 0, 1);
        const s = smoothstep(t, 0, 1);
        this.radius = lerp(GAME.CylinderRadius - HIDDEN_DEPTH, GAME.CylinderRadius + this.outHeight(), s);
        this.theta = this.emerge.theta;
        this.headY = this.emerge.y;
        this.arcDist += p.speed * delta;
        this.waveT += delta;
        if (t >= 1) { this.setState('active'); }
        break;
      }
      case 'active': {
        this.radius = GAME.CylinderRadius + this.outHeight();
        this.theta += (p.speed * delta) / this.radius;
        this.headY = lerp(this.headY, playerY, 1 - Math.exp(-1.5 * delta));
        this.arcDist += p.speed * delta;
        this.waveT += delta;
        const want = this.behavior === 'attack' ? 1 : 0;
        this.attackBlend = lerp(this.attackBlend, want, Math.min(1, delta * 2));
        if (this.phaseT >= p.activeDuration) {
          const den = this.pickTargetDen(map);
          this.target = den ? this.denThetaY(den) : this.emerge;
          this.exitTheta = this.theta;
          this.exitY = this.headY;
          this.setState('diving');
        }
        break;
      }
      case 'diving': {
        const t = clamp(this.phaseT / p.diveTime, 0, 1);
        const s = smoothstep(t, 0, 1);
        this.theta = this.lerpAngle(this.exitTheta, this.target.theta, s);
        this.headY = lerp(this.exitY, this.target.y, s);
        this.radius = lerp(GAME.CylinderRadius + this.outHeight(), GAME.CylinderRadius - HIDDEN_DEPTH, s);
        this.attackBlend = lerp(this.attackBlend, 0, Math.min(1, delta * 3));
        this.arcDist += p.speed * delta;
        this.waveT += delta;
        if (t >= 1) { this.emerge = this.target; this.setState('hidden'); }
        break;
      }
    }
  }

  private setState(s: DragonState) {
    this.state = s;
    this.phaseT = 0;
  }

  private computeHead() {
    const p = this.params;
    const gain = smoothstep(this.radius, GAME.CylinderRadius + 0.5, GAME.CylinderRadius + 3);
    const und = p.amplitude * gain * Math.sin(
      (this.arcDist / Math.max(0.01, p.wavelength)) * Math.PI * 2 - p.waveSpeed * this.waveT,
    );
    this.worldFromCyl(this.headPos, this.theta, this.headY + und, this.radius);
    this.pushTrail(this.headPos);
  }

  // Breadcrumb body → instanced spheres; (attack) bend the front segments inward
  // toward the lagged player-path point. Spine follows the same samples.
  private updateBody() {
    const NSEG = this.D.length;
    const p = this.params;
    const segLen = Math.max(0.02, p.bodyLength / NSEG);
    this.resampleBody(segLen);

    const blend = this.attackBlend;
    const aim = blend > 0.001 ? this.getLaggedPlayer() : null;
    const headR = GAME.CylinderRadius + p.headDist;
    const wall = GAME.CylinderRadius;
    const dummy = this._dummy;

    for (let i = 0; i < NSEG; i++) {
      let pos: THREE.Vector3 = this.D[i];
      if (aim && i < p.bendLength) {
        const ramp = 1 - i / p.bendLength;
        const w = ramp * blend;
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        const th = Math.atan2(pos.x, pos.z);
        const newR = lerp(r, headR, w);
        const newTh = this.lerpAngle(th, aim.theta, w * 0.6);
        const newY = lerp(pos.y, aim.y, w * 0.6);
        pos = this.worldFromCyl(this._seg, newTh, newY, newR);
      }
      // Hide while inside the wall by collapsing the instance to ~0.
      const inside = Math.sqrt(pos.x * pos.x + pos.z * pos.z) < wall - 1;
      const r = inside ? 0.0001 : this.radiusAt(i / NSEG);
      dummy.position.copy(pos);
      dummy.quaternion.identity();
      dummy.scale.setScalar(Math.max(0.0001, r));
      dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, dummy.matrix);
      this.spine.updateTrailPosition(i, pos);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.spine.flush();

    this.updateHeadMesh(aim, blend, headR);
  }

  private updateHeadMesh(aim: CylPoint | null, blend: number, headR: number) {
    const { head } = this;
    let hp: THREE.Vector3 = this.D[0];
    if (aim) {
      const r = Math.sqrt(hp.x * hp.x + hp.z * hp.z);
      const th = Math.atan2(hp.x, hp.z);
      hp = this.worldFromCyl(this._seg, this.lerpAngle(th, aim.theta, blend * 0.6),
        lerp(hp.y, aim.y, blend * 0.6), lerp(r, headR, blend));
    }
    head.position.copy(hp);

    // Point the cone apex along the head's forward direction (toward aim in the
    // attack pose, otherwise along travel: head → next sample).
    if (aim) {
      this.worldFromCyl(this._aim, aim.theta, aim.y, GAME.CylinderRadius);
      this._fwd.copy(this._aim).sub(hp);
    } else {
      this._fwd.copy(hp).sub(this.D[Math.min(1, this.D.length - 1)]);
    }
    if (this._fwd.lengthSq() > 1e-8) {
      head.quaternion.setFromUnitVectors(UP, this._fwd.normalize());
    }
    head.visible = Math.sqrt(hp.x * hp.x + hp.z * hp.z) > GAME.CylinderRadius - 1;
  }

  private resampleBody(segLen: number) {
    const { trail, D } = this;
    const NSEG = D.length;
    let k = trail.length - 1;
    if (k < 0) {
      for (let i = 0; i < NSEG; i++) { D[i].copy(this.headPos); }
      return;
    }
    D[0].copy(trail[k]);
    let target = segLen;
    let accum = 0;
    for (let i = 1; i < NSEG; i++) {
      while (k > 0) {
        const d = trail[k].distanceTo(trail[k - 1]);
        if (accum + d >= target) { break; }
        accum += d; k--;
      }
      if (k <= 0) { D[i].copy(trail[0]); continue; }
      const d = trail[k].distanceTo(trail[k - 1]);
      const f = d > 1e-6 ? (target - accum) / d : 0;
      D[i].lerpVectors(trail[k], trail[k - 1], f);
      target += segLen;
    }
  }

  update(delta: number, playerPosition: any, map: any) {
    if (!this.modelLoaded) { return; }
    this.clock += delta;
    this.samplePlayer(playerPosition);
    this.advanceState(delta, map, playerPosition);
    this.computeHead();
    this.updateBody();
  }
}
