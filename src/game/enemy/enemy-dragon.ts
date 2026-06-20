import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { DRAGON } from '@/game/config';
import { GAME, PHYSICS } from '@/game/const';
import GamePhysicsBody from '@/game/physics/physics-body';
import {
  pickHop, gait, resampleTrail,
  worldRadius, denWorld, denTheta, cylToWorld,
  HIDDEN_DEPTH, DEN_OPENING_RADIUS,
} from '@/game/enemy/dragon-serpentine';
import type GameDragonDen from '@/game/props/dragon-den';

const { smoothstep, clamp } = THREE.MathUtils;
const WUP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;
const ARC_POINTS = 4;       // exterior-arc subdivisions between the two dens (curve control points)
const SPIRAL_SPAN = 0.7;    // angular span (rad) of the spiral in/out of a den hole (smooths the corner)
const SPIRAL_STEPS = 6;     // control points per spiral

// Curvature-driven weave constants (ported from the reference, scaled to be SCALE-INVARIANT by
// normalising curvature κ → κ·R). Each equals the reference's raw-κ value × 5 (its R), so the same
// numbers hold at our R=35. See rideCurve.
const TURN_EASE_K = 0.44;     // advance slowdown per unit normalised curvature (ref 2.2 / 5)
const CURV_CLAMP = 2.0;       // clamp on per-axis normalised curvature (ref 0.4 × 5)
const CURV_WREF = 1.75;       // normalised-curvature scale for the suppress ramp (ref 0.35 × 5)
const WEAVE_SWELL_K = 2.1;    // swell coefficient (ref 1.5, re-derived for normalised κ at ×7 world)
const WEAVE_SWELL_CAP = 2.0;  // max world-unit swell added to an axis (ref 0.30 × 7)

interface DragonOptions {
  parent: THREE.Object3D | null;
  tailSize: number;
}

const DEFAULT: DragonOptions = {
  parent: null,
  tailSize: 100,
};

type DragonState = 'hidden' | 'active';
// Phase within an appearance, for the overlay only: emerging out of the entry den, travelling the
// exterior arc, diving into the target den. Derived from which third of the lap u is in.
type Phase = 'emerge' | 'travel' | 'dive';

/*
  Path-first serpenoid-gait dragon (ported from the user's reference HTML; supersedes the earlier
  "no rail" gait-first attempt). ONE APPEARANCE = ONE THREADED LAP:

    • beginAppearance → pickHop gives an entry den + a target den.
    • buildAppearanceCurve builds a CatmullRomCurve3 (centripetal) that passes EXACTLY through
      both den openings: entryHidden → entryOut → exterior arc at the out-radius → targetOut →
      targetHidden. Because the openings are control points, the head threads them by construction.
    • Per frame the head rides the curve (rideCurve). The serpenoid weave is a positional offset on
      two axes (lateral r2, normal r3), DAMPED to ~0 near each opening (gain via smoothstep), so the
      weave never pushes the head off a hole while crossing it — flat at the den, full in the open.
    • When the lap completes the head drains inward along the end tangent (into the target hole) until
      the body is fully hidden, then hide → dwell → reappear.

  The body is the head's world trail resampled at fixed arc length (resampleTrail), so every vertebra
  passes through the exact points the head did — including the den openings.

  Rendering is a DEBUG representation: an InstancedMesh of tapered spheres + a connecting line + a
  head cone. The GLTF mesh returns once movement is dialled in.
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

  // --- head ride (world space) ---
  private P = new THREE.Vector3();   // head position (curve point + damped weave)
  private headDist = 0;              // distance flown — drives the weave phase
  private lapDist = 0;               // arc length travelled along the appearance curve
  private smYaw = 0;                 // smoothed normalised path curvature on the lateral axis
  private smPit = 0;                 // smoothed normalised path curvature on the normal axis
  private trail: THREE.Vector3[] = [];

  // --- appearance curve ---
  private curve: THREE.CatmullRomCurve3 | null = null;
  private curveLen = 1;
  private endTangent = new THREE.Vector3(0, 0, -1); // tangent at u=1 (radially into the target hole)
  private entryDen: GameDragonDen | null = null;
  private targetDen: GameDragonDen | null = null;
  private entryWall = new THREE.Vector3();  // entry opening centre on the wall (weave-damp focus)
  private targetWall = new THREE.Vector3(); // target opening centre on the wall
  private phase: Phase = 'emerge';
  private chainEnding = false;       // lap done; head drains the body into the target hole
  private bodyVisible = false;       // any bead outside the wall (set in updateBody)
  private trailVersion = 0;          // bumped per appearance so the editor overlay can resync

  // --- body beads (sample the trail each frame) ---
  D: THREE.Vector3[];

  // scratch
  private _dummy = new THREE.Object3D();
  private _green = new THREE.Color(0x2fae84);
  private _col = new THREE.Color();
  private _base = new THREE.Vector3();
  private _t = new THREE.Vector3();
  private _r2 = new THREE.Vector3();
  private _r3 = new THREE.Vector3();
  private _fwd = new THREE.Vector3();
  private _ct0 = new THREE.Vector3();   // tangent at u−eps (curvature sample)
  private _ct1 = new THREE.Vector3();   // tangent at u+eps
  private _curv = new THREE.Vector3();  // curvature vector (dT/ds)
  private _smooth = new THREE.Vector3(); // body Laplacian-smoothing scratch

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
    this.chainEnding = false;
    this.bodyVisible = false;
    this.curve = null;
    this.smYaw = 0;
    this.smPit = 0;
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
  // so this just builds the curve + places the head at the entry den).
  spawnAppearance(map: any, playerY: number): boolean {
    if (this.beginAppearance(map, playerY)) { this.setState('active'); return true; }
    return false;
  }

  // --- helpers ---------------------------------------------------------------

  private get outRadius() { return GAME.CylinderRadius + this.params.circleHeight; }
  private get hiddenRadius() { return GAME.CylinderRadius - HIDDEN_DEPTH; }

  private setState(s: DragonState) {
    this.state = s;
    this.phaseT = 0;
  }

  // --- appearance lifecycle --------------------------------------------------

  private beginAppearance(map: any, playerY: number): boolean {
    const hop = pickHop(map.getActiveDens(), playerY, this.params, null);
    if (!hop) { return false; }
    this.entryDen = hop.entry;
    this.targetDen = hop.target;
    this.chainEnding = false;
    this.buildAppearanceCurve();
    this.startRide();
    this.trailVersion += 1;
    return true;
  }

  // Build the lap curve: a centripetal Catmull-Rom from inside the entry den, out through the
  // entry opening, along the exterior arc, and back into the target den. The wall crossings are
  // SPIRALS (ported from the reference) — the angle eases toward the den angle while the radius
  // changes LINEARLY, so the tangent turns gradually from radial to tangential (no corner/cusp at
  // the hole), yet the crossing still lands exactly on the opening. Caches the end tangent
  // (radially into the target hole) for the drain, and the two opening centres for the weave damp.
  private buildAppearanceCurve() {
    const entry = this.entryDen!;
    const target = this.targetDen!;
    const outR = this.outRadius;
    const hidR = this.hiddenRadius;
    const R = GAME.CylinderRadius;
    const ey = entry.body.position.y;
    const ty = target.body.position.y;
    const aE = denTheta(entry);
    const aT = denTheta(target);
    let d = aT - aE;
    while (d > Math.PI) { d -= TWO_PI; }
    while (d < -Math.PI) { d += TWO_PI; }
    const dir = d >= 0 ? 1 : -1;
    // spiral span, clamped so the exterior arc keeps room between the two spirals.
    const spin = Math.min(SPIRAL_SPAN, Math.max(0.12, Math.abs(d) / 2 - 0.05));
    const v = () => new THREE.Vector3();

    const pts: THREE.Vector3[] = [
      cylToWorld(v(), aE, ey, hidR),  // entryHidden — inside the wall
      cylToWorld(v(), aE, ey, R),     // entry opening — on the wall
    ];
    // EMERGE spiral: nose out of the hole. Angle eases aE → aE+dir·spin (slow at the wall, ea=f²)
    // while the radius climbs linearly R → outR — radial→tangential with no corner.
    for (let s = 1; s <= SPIRAL_STEPS; s++) {
      const f = s / SPIRAL_STEPS; const ea = f * f;
      pts.push(cylToWorld(v(), aE + dir * spin * ea, ey, R + (outR - R) * f));
    }
    // exterior arc at the out-radius, from just past the entry to just before the target.
    const arcStart = aE + dir * spin;
    const arcEnd = aT - dir * spin;
    for (let s = 1; s < ARC_POINTS; s++) {
      const f = s / ARC_POINTS;
      pts.push(cylToWorld(v(), arcStart + (arcEnd - arcStart) * f, ey + (ty - ey) * f, outR));
    }
    // DIVE spiral: settle onto the target. Angle eases aT−dir·spin → aT (slow at the wall,
    // ea=f(2−f)) while the radius drops linearly outR → R, ending radial at the opening.
    for (let s = 1; s <= SPIRAL_STEPS; s++) {
      const f = s / SPIRAL_STEPS; const ea = f * (2 - f);
      pts.push(cylToWorld(v(), aT - dir * spin * (1 - ea), ty, outR + (R - outR) * f));
    }
    pts.push(cylToWorld(v(), aT, ty, hidR)); // targetHidden — straight radial in (last point)

    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    this.curve.arcLengthDivisions = 400;
    this.curve.updateArcLengths();
    this.curveLen = Math.max(1e-3, this.curve.getLength());
    this.curve.getTangentAt(1, this.endTangent).normalize();
    denWorld(this.entryWall, entry, R);
    denWorld(this.targetWall, target, R);
  }

  // Place the head at the start of the curve (inside the entry den) and seed a straight hidden tail
  // behind it along −tangent(0), so the body uncoils out of the den instead of snapping.
  private startRide() {
    const c = this.curve!;
    this.headDist = 0;
    this.lapDist = 0;
    this.smYaw = 0;
    this.smPit = 0;
    this.phase = 'emerge';
    c.getPointAt(0, this.P);
    c.getTangentAt(0, this._fwd).normalize();
    this.trail.length = 0;
    const step = 0.4;
    const n = Math.ceil((this.params.bodyLength + 4) / step);
    for (let s = n; s >= 0; s--) {
      this.trail.push(this.P.clone().addScaledVector(this._fwd, -s * step));
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

    this.rideCurve(delta);
    this.updateBody();

    // Hide completely once the drain has pulled the whole body into the den.
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

  // Ride the appearance curve, applying the den-damped serpenoid weave, then (once the lap is done)
  // drain inward along the end tangent so the body funnels into the target hole. Grows the trail.
  private rideCurve(delta: number) {
    if (!this.curve) { return; }
    const p = this.params;
    const g = gait(p, this.D.length);

    if (this.chainEnding) {
      // drain: continue radially inward into the target hole, no weave; the body follows.
      this.P.addScaledVector(this.endTangent, g.speed * delta);
      this.phase = 'dive';
    } else {
      // ease the advance through tight bends (uses last frame's smoothed curvature) so the head
      // doesn't whip around the spiral corners.
      const turnEase = 1 / (1 + TURN_EASE_K * Math.max(this.smYaw, this.smPit));
      const move = g.speed * delta * turnEase;
      this.headDist += move;
      this.lapDist += move;
      if (this.lapDist >= this.curveLen) {
        this.lapDist = this.curveLen;
        this.chainEnding = true;
      }
      const u = clamp(this.lapDist / this.curveLen, 0, 1);
      this.curve.getPointAt(u, this._base);
      this.curve.getTangentAt(u, this._t).normalize();
      // frame: r2 = WUP × t (lateral, around the wall), r3 = t × r2 (normal, in/out of the wall).
      this._r2.crossVectors(WUP, this._t);
      if (this._r2.lengthSq() < 1e-6) { this._r2.set(1, 0, 0); }
      this._r2.normalize();
      this._r3.crossVectors(this._t, this._r2).normalize();
      // damp the weave to ~0 within an opening so the curve threads the exact hole.
      const dDen = Math.min(this._base.distanceTo(this.entryWall), this._base.distanceTo(this.targetWall));
      const gain = smoothstep(dDen, DEN_OPENING_RADIUS * 1.15, p.denFade);

      // curvature-driven amplitude: the weave swells in gentle turns and is suppressed (per
      // cross-axis) in sharp ones. Curvature is sampled from the tangent, normalised by R
      // (scale-invariant), clamped, slow-smoothed and capped so a bend can't blow it up.
      let aH = p.ampH; let aV = p.ampV;
      if (p.dynamicWeave) {
        const eps = 0.01;
        const u0 = Math.max(0, u - eps); const u1 = Math.min(1, u + eps);
        this.curve.getTangentAt(u0, this._ct0).normalize();
        this.curve.getTangentAt(u1, this._ct1).normalize();
        const ds = Math.max(1e-3, (u1 - u0) * this.curveLen);
        this._curv.subVectors(this._ct1, this._ct0).multiplyScalar(1 / ds); // κ = dT/ds (1/len)
        const kH = Math.min(Math.abs(this._curv.dot(this._r2)) * GAME.CylinderRadius, CURV_CLAMP);
        const kV = Math.min(Math.abs(this._curv.dot(this._r3)) * GAME.CylinderRadius, CURV_CLAMP);
        const nearSeam = (u < 0.04 || u > 0.96); // hold across the curve ends (tangent kink)
        const sm = 1 - Math.exp(-delta / 0.40);  // ~0.4 s time constant
        if (!nearSeam) { this.smYaw += (kH - this.smYaw) * sm; this.smPit += (kV - this.smPit) * sm; }
        const ramp2 = clamp(this.smYaw / CURV_WREF, 0, 1);
        const ramp3 = clamp(this.smPit / CURV_WREF, 0, 1);
        aH = (p.ampH + p.turnAmp * this.smYaw * WEAVE_SWELL_K) * (1 - p.suppress * ramp3);
        aV = (p.ampV + p.turnAmp * this.smPit * WEAVE_SWELL_K) * (1 - p.suppress * ramp2);
        aH = Math.min(aH, p.ampH + WEAVE_SWELL_CAP);
        aV = Math.min(aV, p.ampV + WEAVE_SWELL_CAP);
      }

      const ph = (TWO_PI * this.headDist) / g.lambda;
      this.P.copy(this._base)
        .addScaledVector(this._r2, aH * gain * Math.sin(ph))
        .addScaledVector(this._r3, aV * gain * Math.sin(ph + p.delta));
      this.phase = u < 1 / 3 ? 'emerge' : (u > 2 / 3 ? 'dive' : 'travel');
    }

    // grow the trail (the body retraces it exactly).
    const last = this.trail[this.trail.length - 1];
    if (!last || last.distanceTo(this.P) > 1e-4) { this.trail.push(this.P.clone()); }
    const cap = this.D.length * 2 + 256;
    if (this.trail.length > cap) { this.trail.splice(0, this.trail.length - cap); }
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

    // Light Laplacian smoothing (2 passes) to relax any residual kink at the spiral crossings.
    // Skip beads near a den so the threading through the openings stays exact.
    if (this.state === 'active') {
      const skipR = DEN_OPENING_RADIUS * 1.7;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 1; i < N - 1; i++) {
          if (this.D[i].distanceTo(this.entryWall) < skipR
            || this.D[i].distanceTo(this.targetWall) < skipR) { continue; }
          this._smooth.copy(this.D[i - 1]).add(this.D[i + 1]).multiplyScalar(0.5);
          this.D[i].lerp(this._smooth, 0.2);
        }
      }
    }

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
