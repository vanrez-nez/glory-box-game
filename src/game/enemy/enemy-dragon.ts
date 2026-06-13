import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { DRAGON } from '@/game/config';
import { GAME, PHYSICS } from '@/game/const';
import GamePhysicsBody from '@/game/physics/physics-body';
import {
  pickHop, gait, pathSpeed, resampleTrail,
  worldRadius, denWorld, HIDDEN_DEPTH,
} from '@/game/enemy/dragon-serpentine';
import type GameDragonDen from '@/game/props/dragon-den';

const { smoothstep, clamp } = THREE.MathUtils;
const WUP = new THREE.Vector3(0, 1, 0);

interface DragonOptions {
  parent: THREE.Object3D | null;
  tailSize: number;
}

const DEFAULT: DragonOptions = {
  parent: null,
  tailSize: 100,
};

type DragonState = 'hidden' | 'active';
// Phase within an appearance: rise out of a den → slither at out-radius → dive into the
// target den → (when chaining) crawl UNDER the wall, hidden, to the next entry den → emerge
// again. After the final dive the body keeps draining into the hole (chainEnding).
type Phase = 'emerge' | 'travel' | 'dive' | 'transit';

/*
  Gait-first serpenoid dragon (see memory dragon-gait-first + the approved plan). A sinusoid
  drives the HEAD's heading; the head writes a world-space trail; the body follows that trail
  at fixed arc spacing. There is no precomputed rail — the head is a live steerable controller,
  so map/goal influences are just steering nudges. The cylinder enters only through den targets
  and "altitude" = distance from the cylinder axis (travel just beyond the wall; emerge/dive
  ramp that radius through a den hole).

  Rendering is a DEBUG representation: an InstancedMesh of tapered spheres + a connecting line
  + a head cone. The GLTF mesh returns once movement is dialled in.
*/
export default class GameEnemyDragon {
  opts: DragonOptions;
  events: EventEmitter3;
  params: typeof DRAGON;
  modelLoaded: boolean;
  body: GamePhysicsBody;
  head!: THREE.Mesh;
  bodyMesh!: THREE.InstancedMesh;
  bodyLine!: THREE.Line;

  // --- state machine ---
  state: DragonState;
  phaseT: number;   // seconds in the current 'hidden' dwell
  clock: number;

  // --- head controller (world space) ---
  private P = new THREE.Vector3();   // head position
  private F = new THREE.Vector3(1, 0, 0); // forward (unit)
  private Rg = new THREE.Vector3(0, 0, -1); // right (unit)
  private Ug = new THREE.Vector3(0, 1, 0);  // up (unit)
  private headDist = 0;              // distance flown — drives the wave phase
  private trail: THREE.Vector3[] = [];

  // --- appearance / hop state ---
  private phase: Phase = 'emerge';
  private phaseTime = 0;             // seconds in the current emerge/dive ramp
  private ampScale = 0;              // 0..1 undulation envelope (sigmoid on emerge/dive)
  private desiredRadius = 0;         // current "altitude" target (emerge/dive envelope)
  private entryDen: GameDragonDen | null = null;
  private targetDen: GameDragonDen | null = null;
  private lastDen: GameDragonDen | null = null;
  private hopCount = 0;
  private chainEnding = false;       // last dive done; body draining into the final den
  private bodyVisible = false;       // any bead outside the wall (set in updateBody)
  private trailVersion = 0;          // bumped on each appearance so the editor can resync

  // --- body beads (sample the trail each frame) ---
  D: THREE.Vector3[];

  // scratch
  private _dummy = new THREE.Object3D();
  private _green = new THREE.Color(0x2fae84);
  private _col = new THREE.Color();
  private _des = new THREE.Vector3();
  private _axis = new THREE.Vector3();
  private _fwd = new THREE.Vector3();
  private _tmp = new THREE.Vector3();
  private _q = new THREE.Quaternion();

  constructor(opts: Partial<DragonOptions> = {}) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.params = { ...DRAGON };
    this.body = this.getBody();

    this.state = 'hidden';
    this.phaseT = 0;
    this.clock = 0;

    this.D = [];
    for (let i = 0; i < this.opts.tailSize; i++) { this.D.push(new THREE.Vector3()); }

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
    // Body: instanced spheres, sized by the taper profile (no orientation needed).
    const sphereGeo = new THREE.SphereGeometry(1, 12, 10);
    // Unlit so the body stays bright in the dark scene (a lit material renders black here).
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2fae84 });
    this.bodyMesh = new THREE.InstancedMesh(sphereGeo, bodyMat, this.opts.tailSize);
    this.bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyMesh.frustumCulled = false;
    parent!.add(this.bodyMesh);

    // Head: a cone whose apex points along travel.
    const coneGeo = new THREE.ConeGeometry(0.95, 2.6, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xff7a3a, roughness: 0.4,
      emissive: 0x5a1e08, emissiveIntensity: 0.9,
    });
    this.head = new THREE.Mesh(coneGeo, headMat);
    this.head.frustumCulled = false;
    parent!.add(this.head);

    // Plain line through the body beads (same kind as the editor spline debug).
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position',
      new THREE.Float32BufferAttribute(new Float32Array(this.opts.tailSize * 3), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    lineMat.fog = false;
    this.bodyLine = new THREE.Line(lineGeo, lineMat);
    this.bodyLine.frustumCulled = false;
    parent!.add(this.bodyLine);

    AudioManager.setPositionalTrackParent('wind_loop', this.head);
    AudioManager.setPositionalTrackParent('dragon_near_loop', this.head);
  }

  restart() {
    this.state = 'hidden';
    this.phaseT = 0;
    this.trail.length = 0;
    this.lastDen = null;
    this.chainEnding = false;
    this.bodyVisible = false;
  }

  // --- editor / debug accessors ----------------------------------------------

  getTrailVersion() { return this.trailVersion; }

  // Live snapshot for the editor overlay: the chosen dens + the head's world trail.
  getDebugState(): {
    entryDen: GameDragonDen | null; targetDen: GameDragonDen | null;
    head: THREE.Vector3; trail: THREE.Vector3[];
  } {
    return { entryDen: this.entryDen, targetDen: this.targetDen, head: this.P, trail: this.trail };
  }

  // Editor "Spawn Dragon" button: force a fresh appearance (the loop is frozen in edit mode,
  // so this just plans the hop + places the head at the chosen den).
  spawnAppearance(map: any, playerY: number): boolean {
    if (this.beginAppearance(map, playerY)) { this.setState('active'); return true; }
    return false;
  }

  // --- helpers ---------------------------------------------------------------

  private get outRadius() { return GAME.CylinderRadius + this.params.circleHeight; }
  private get hiddenRadius() { return GAME.CylinderRadius - HIDDEN_DEPTH; }

  // Out-radius point above a den (the travel goal) / hidden point at a den (the dive goal).
  private denOutPoint(out: THREE.Vector3, den: GameDragonDen) {
    return denWorld(out, den, this.outRadius);
  }

  private denHiddenPoint(out: THREE.Vector3, den: GameDragonDen) {
    return denWorld(out, den, this.hiddenRadius);
  }

  private setState(s: DragonState) {
    this.state = s;
    this.phaseT = 0;
  }

  // Rebuild the orthonormal head frame. "Up" is the RADIAL direction (the wall's surface
  // normal at the head), not world-Y — so the lateral (yaw) weave stays on the wall surface
  // and only the pitch weave goes in/out of the wall. Using world-up here makes the weave
  // fight the radius controller near the cylinder and cusp the path.
  private rebuildFrame() {
    this._tmp.set(this.P.x, 0, this.P.z);                 // radial up (out from the axis)
    if (this._tmp.lengthSq() < 1e-6) { this._tmp.copy(WUP); } else { this._tmp.normalize(); }
    this.Rg.crossVectors(this._tmp, this.F);              // right = up × forward (tangent)
    if (this.Rg.lengthSq() < 1e-6) { this.Rg.set(0, 0, -1); }
    this.Rg.normalize();
    this.Ug.crossVectors(this.F, this.Rg).normalize();    // up ≈ radial, exactly ⟂ to F
  }

  // --- appearance lifecycle --------------------------------------------------

  private beginAppearance(map: any, playerY: number): boolean {
    const hop = pickHop(map.getActiveDens(), playerY, this.params, null);
    if (!hop) { return false; }
    this.entryDen = hop.entry;
    this.targetDen = hop.target;
    this.lastDen = null;
    this.hopCount = 0;
    this.chainEnding = false;
    this.startHop();
    this.trailVersion += 1;
    return true;
  }

  // Spawn (or re-spawn, when chaining) the head inside the entry den and aim it at the target.
  private startHop() {
    this.denHiddenPoint(this.P, this.entryDen!);
    this.headDist = 0;
    this.phase = 'emerge';
    this.phaseTime = 0;
    this.ampScale = 0;
    this.desiredRadius = this.hiddenRadius;
    // Aim out of the den toward the target's out-point, so it rises while moving.
    this.denOutPoint(this._des, this.targetDen!);
    this.F.copy(this._des).sub(this.P);
    if (this.F.lengthSq() < 1e-6) { this.F.copy(this.P).normalize(); } // radial fallback
    this.F.normalize();
    this.rebuildFrame();
    // Seed the trail so the body has something to follow (it uncoils from the den as the
    // trail grows; beads beyond the trail collapse onto the den, staying hidden).
    this.trail.length = 0;
    this.trail.push(this.P.clone());
  }

  // Advance to the next den-hop, or end the appearance (let the body drain into the den).
  // Chaining does NOT teleport the head (that reshuffles the trail and jumps the body): it
  // enters 'transit', steering the head — continuously, at hidden radius, below the wall — to
  // the next entry den, then emerging there. The whole transit stretch is invisible.
  private nextHopOrEnd(map: any, playerY: number) {
    this.lastDen = this.targetDen;
    this.hopCount += 1;
    const hop = this.hopCount < this.params.maxHops
      ? pickHop(map.getActiveDens(), playerY, this.params, this.lastDen)
      : null;
    if (hop) {
      this.entryDen = hop.entry;
      this.targetDen = hop.target;
      this.phase = 'transit';
      this.phaseTime = 0;
      this.ampScale = 0;
      this.desiredRadius = this.hiddenRadius;
      this.trailVersion += 1;
    } else {
      this.chainEnding = true; // drain: head keeps slithering (hidden) until the body clears
    }
  }

  // --- per-frame -------------------------------------------------------------

  update(delta: number, playerPosition: any, map: any) {
    if (!this.modelLoaded) { return; }
    this.clock += delta;

    if (this.state === 'hidden') {
      this.phaseT += delta;
      if (this.phaseT >= this.params.hiddenDwell) {
        if (this.beginAppearance(map, playerPosition.y)) { this.setState('active'); } else { this.phaseT = 0; }
      }
      this.bodyMesh.visible = false;
      this.head.visible = false;
      this.bodyLine.visible = false;
      return;
    }

    this.steerHead(delta, playerPosition, map);
    this.advancePhase(delta, playerPosition, map);
    this.updateBody();

    // Hide completely once the final dive has drained the whole body into the den.
    if (this.chainEnding && !this.bodyVisible) {
      this.trail.length = 0;
      this.setState('hidden');
      this.bodyMesh.visible = false;
      this.head.visible = false;
      this.bodyLine.visible = false;
      return;
    }
    this.bodyMesh.visible = true;
    this.bodyLine.visible = true;
  }

  // Steer the forward vector toward the current goal (rate-limited), add the serpenoid weave,
  // advance the head, hold "altitude" (radius) toward the phase envelope, and grow the trail.
  private steerHead(delta: number, playerPosition: any, map: any) {
    const p = this.params;
    const g = gait(p);

    // desired forward = toward the phase goal (+ influence seam, off by default).
    if (this.chainEnding || this.phase === 'dive') {
      // Dive/drain: DON'T keep pursuing the den point (that overshoots and U-turns at full
      // speed near the wall). Hold heading and let the radius envelope plunge it through the
      // hole — it's already arrived above the den, so straight-down threads it cleanly.
      this._des.copy(this.F);
    } else if (this.phase === 'transit') {
      this.denHiddenPoint(this._des, this.entryDen!).sub(this.P);   // under-wall to next den
    } else {
      this.denOutPoint(this._des, this.targetDen!).sub(this.P);     // out-radius above target
    }
    if (this._des.lengthSq() < 1e-8) { this._des.copy(this.F); } else { this._des.normalize(); }
    this.applyInfluences(this._des, playerPosition, map); // seam — no-op by default

    // turn F toward desired, rate-limited (banking/pitching).
    const ang = this.F.angleTo(this._des);
    if (ang > 1e-4) {
      this._axis.crossVectors(this.F, this._des);
      if (this._axis.lengthSq() < 1e-9) { this._axis.copy(this.Ug); } else { this._axis.normalize(); }
      const step = Math.min(ang, Math.min(p.maxTurn, p.agility * ang) * delta);
      this._q.setFromAxisAngle(this._axis, step);
      this.F.applyQuaternion(this._q).normalize();
    }
    this.rebuildFrame();

    // advance along the weaving tangent; pathSpeed compensates for wiggle so net speed holds.
    const speed = pathSpeed(p, g);
    this.headDist += speed * delta;
    const ph = g.kw * this.headDist;
    // Lateral serpenoid weave: yaw the heading about the radial "up" so the wave stays on the
    // wall surface — that single axis already serpentines both around the cylinder and along
    // its axis. (A second, radial axis would lift the body off / clip the wall and cusp.)
    this._fwd.copy(this.F);
    this._q.setFromAxisAngle(this.Ug, this.ampScale * g.psiH * Math.sin(ph));
    this._fwd.applyQuaternion(this._q);
    this._fwd.normalize();
    this.P.addScaledVector(this._fwd, speed * delta);

    // hold "altitude": set the head's cylinder radius to the phase envelope (emerge/dive).
    // desiredRadius is already smoothstep-eased, so radial velocity → 0 at the top of the
    // emerge / bottom of the dive — no radial→tangential corner where it flattens out.
    const curR = worldRadius(this.P) || 1e-3;
    const sc = this.desiredRadius / curR;
    this.P.x *= sc; this.P.z *= sc;

    // grow the trail.
    const last = this.trail[this.trail.length - 1];
    if (!last || last.distanceTo(this.P) > 1e-4) { this.trail.push(this.P.clone()); }
    const need = Math.ceil(p.bodyLength / Math.max(0.05, p.bodyLength / this.D.length)) + 64;
    const cap = this.D.length + need + 256;
    if (this.trail.length > cap) { this.trail.splice(0, this.trail.length - cap); }
  }

  // Influence seam: future map-property steering nudges sum into `dir` here. No-op by default.
  // (The reference's obstacle-repulsion is the worked example of what plugs in.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  private applyInfluences(_dir: THREE.Vector3, _playerPosition: any, _map: any) { /* hooks */ }

  // Drive the emerge→travel→dive envelopes (amplitude + radius) and the goal transitions.
  private advancePhase(delta: number, playerPosition: any, map: any) {
    const p = this.params;
    this.phaseTime += delta;
    if (this.chainEnding) { this.ampScale = 0; this.desiredRadius = this.hiddenRadius; return; }

    switch (this.phase) {
      case 'emerge': {
        const t = clamp(this.phaseTime / Math.max(0.05, p.emergeTime), 0, 1);
        this.ampScale = smoothstep(t, 0, 1);
        this.desiredRadius = this.hiddenRadius + (this.outRadius - this.hiddenRadius) * smoothstep(t, 0, 1);
        if (t >= 1) { this.phase = 'travel'; this.phaseTime = 0; }
        break;
      }
      case 'travel': {
        this.ampScale = 1;
        this.desiredRadius = this.outRadius;
        this.denOutPoint(this._tmp, this.targetDen!);
        if (this.P.distanceTo(this._tmp) <= p.arrivalRadius) { this.phase = 'dive'; this.phaseTime = 0; }
        break;
      }
      case 'dive': {
        const t = clamp(this.phaseTime / Math.max(0.05, p.diveTime), 0, 1);
        this.ampScale = smoothstep(1 - t, 0, 1);
        this.desiredRadius = this.hiddenRadius + (this.outRadius - this.hiddenRadius) * smoothstep(1 - t, 0, 1);
        if (t >= 1) { this.nextHopOrEnd(map, playerPosition.y); }
        break;
      }
      case 'transit': {
        // Hidden under-wall crawl to the next entry den; emerge once we reach it.
        this.ampScale = 0;
        this.desiredRadius = this.hiddenRadius;
        this.denHiddenPoint(this._tmp, this.entryDen!);
        if (this.P.distanceTo(this._tmp) <= p.arrivalRadius) { this.phase = 'emerge'; this.phaseTime = 0; }
        break;
      }
    }
  }

  // Sphere radius along the body (debug taper: head → tail).
  private radiusAt(tn: number) { return this.params.bodyRadius * (1 - 0.55 * tn); }

  // Body = the head's world trail resampled at uniform arc length behind it. Beads inside the
  // wall collapse (hidden). Sets bodyVisible (any bead outside the wall).
  private updateBody() {
    const N = this.D.length;
    const wall = GAME.CylinderRadius;
    const segLen = Math.max(0.02, this.params.bodyLength / N);
    resampleTrail(this.trail, N, segLen, this.D);

    const linePos = this.bodyLine.geometry.attributes.position.array as Float32Array;
    const dummy = this._dummy;
    let anyVisible = false;
    for (let i = 0; i < N; i++) {
      const d = this.D[i];
      const inside = worldRadius(d) < wall - 1;
      if (!inside) { anyVisible = true; }
      const r = inside ? 0.0001 : this.radiusAt(i / N);
      dummy.position.copy(d);
      dummy.quaternion.identity();
      dummy.scale.setScalar(Math.max(0.0001, r));
      dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, dummy.matrix);
      this.bodyMesh.setColorAt(i, this._col.copy(this._green));
      linePos[i * 3] = d.x; linePos[i * 3 + 1] = d.y; linePos[i * 3 + 2] = d.z;
    }
    this.bodyVisible = anyVisible;
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    if (this.bodyMesh.instanceColor) { this.bodyMesh.instanceColor.needsUpdate = true; }
    this.bodyLine.geometry.attributes.position.needsUpdate = true;
    this.updateHeadMesh();
  }

  private updateHeadMesh() {
    const { head } = this;
    const hp = this.D[0];
    head.position.copy(hp);
    this._fwd.copy(hp).sub(this.D[Math.min(2, this.D.length - 1)]);
    if (this._fwd.lengthSq() > 1e-8) { head.quaternion.setFromUnitVectors(WUP, this._fwd.normalize()); }
    head.visible = worldRadius(hp) > GAME.CylinderRadius - 1;
  }
}
