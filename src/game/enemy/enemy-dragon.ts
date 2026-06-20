import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { DRAGON } from '@/game/config';
import { GAME, PHYSICS } from '@/game/const';
import GamePhysicsBody from '@/game/physics/physics-body';
import {
  pickHop, gait, resampleTrail,
  worldRadius, denWorld, denTheta, cylToWorld,
  DEN_OPENING_RADIUS,
} from '@/game/enemy/dragon-serpentine';
import type GameDragonDen from '@/game/props/dragon-den';

const { smoothstep, clamp } = THREE.MathUtils;
const WUP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;
// Spiral/lead/sweep spans are WORLD arc-lengths (units along the wall), converted to an angle by ÷R
// in buildLap. They must NOT be raw radians: the reference authored them at R=5, so its 1.05-rad
// spiral was only ~5 world units; reused as radians at our R=35 that becomes ~35 units of wall the
// dragon skims past instead of plunging through the den. Keeping them in world units stays tight at
// any R, so the den crossing is nearly radial (through the hole).
const SPIRAL_ARC = 4.0;       // den dive/emerge span (world units) — tight ⇒ ~radial cross through the hole
const LEAD_ARC = 1.5;         // tangential lead in/out (world units) — shares a tangent across the seam (C1)
const SWEEP_STEP = 4.0;       // exterior-sweep sampling: one control point per ~this many world units
const SPIRAL_STEPS = 6;       // control points per spiral
const INTERIOR_PULL = 0.32;   // how far the interior pass is pulled toward the cylinder axis (0..1)
const FIRST_LAP_LEAD = 0.5;   // seed sweep angle before the first entry so lap 0 has a short approach (rad)

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

// idle = no valid lap could be built (fewer than 2 usable dens in the player's segment); the dragon
// waits invisibly and retries each frame. running = riding the continuous lap chain.
type DragonState = 'idle' | 'running';
// Phase within a lap, for the overlay only: emerging out of the entry den, travelling the exterior
// sweep, diving into the exit den. Derived from which third of the lap u is in.
type Phase = 'emerge' | 'travel' | 'dive';

/*
  Path-first serpenoid-gait dragon (ported from the user's reference HTML). MOVEMENT IS ONE
  CONTINUOUS LAP CHAIN — the dragon never hides or dwells:

    • buildLap → pickHop gives a fresh entry den + exit den (≠ last). The lap is a CatmullRomCurve3
      (centripetal) from the persistent cruise point on the exterior arc: tangential lead-in →
      exterior sweep AROUND the wall to the entry (shortest direction) → spiral IN to the entry
      opening → interior pass through the drum → spiral OUT of the exit opening → tangential lead-out.
      That lead-out becomes the next lap's cruise point, so consecutive laps share point AND tangent
      (C1 seam, no corner). Because the openings are control points, the head threads them exactly.
    • Per frame the head rides the curve (rideCurve). The serpenoid weave is a positional offset on
      two axes (lateral r2, normal r3), DAMPED to ~0 near each opening (gain via smoothstep), so the
      weave never pushes the head off a hole while crossing it — flat at the den, full in the open.
    • When the lap completes the chain immediately builds the next lap from the shared seam — no
      drain, no hide, no dwell.

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
  clock: number;

  // --- head ride (world space) ---
  private P = new THREE.Vector3();   // head position (curve point + damped weave)
  private headDist = 0;              // distance flown — drives the weave phase
  private lapDist = 0;               // arc length travelled along the appearance curve
  private smYaw = 0;                 // smoothed normalised path curvature on the lateral axis
  private smPit = 0;                 // smoothed normalised path curvature on the normal axis
  private trail: THREE.Vector3[] = [];

  // --- lap curve ---
  private curve: THREE.CatmullRomCurve3 | null = null;
  private curveLen = 1;
  private entryDen: GameDragonDen | null = null;
  private targetDen: GameDragonDen | null = null;   // the exit den of the current lap
  private lastDen: GameDragonDen | null = null;      // previous lap's exit (excluded from the next entry)
  private entryWall = new THREE.Vector3();  // entry opening centre on the wall (weave-damp focus)
  private targetWall = new THREE.Vector3(); // exit opening centre on the wall
  // Persistent position on the exterior arc, shared between laps for a C1 seam (no corner).
  private cruiseTheta = 0;
  private cruiseY = 0;
  // Rotational sense of the whole run (+1 / −1). Locked for the run so the visible arc NEVER
  // reverses; a den "behind" the dragon is reached by circling around, not by backing up. Randomised
  // per run for variety.
  private spinDir = 1;
  private phase: Phase = 'emerge';
  private bodyVisible = false;       // any bead outside the wall (set in updateBody)
  private trailVersion = 0;          // bumped per lap so the editor overlay can resync

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

    this.state = 'idle';
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
    const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    // Lit (like the head) so the scene lights shade the body. The green comes from the per-instance
    // instanceColor (set in updateBody), so the material colour is white; a dim emissive keeps the
    // beads from reading pure black in the dark scene while still letting the lighting show.
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.45, metalness: 0.1,
      emissive: 0x0a3326, emissiveIntensity: 0.35,
    });
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
    this.state = 'idle';
    this.trail.length = 0;
    this.bodyVisible = false;
    this.curve = null;
    this.lastDen = null;
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

  // Editor "Spawn Dragon" button: start a fresh continuous run (the loop is frozen in edit mode,
  // so this just builds lap 0 + places the head at its start).
  spawnAppearance(map: any, playerY: number): boolean {
    this.state = 'idle';
    this.lastDen = null;
    this.spinDir = Math.random() < 0.5 ? -1 : 1;
    if (this.buildLap(map, playerY)) {
      this.state = 'running';
      this.seedRide();
      this.trailVersion += 1;
      return true;
    }
    return false;
  }

  // --- helpers ---------------------------------------------------------------

  // Range of motion of the weave, as a radial distance (world units). The weave is
  // offset = r2·(aH·g·sinφ) + r3·(aV·g·sin(φ+δ)) with r2 ⟂ r3 orthonormal and g (gain) ≤ 1; since
  // |sin| ≤ 1 the worst-case radial excursion is g·hypot(aH, aV). This returns the STATIC worst case
  // (full gain, amps at their dynamic-swell cap) — the baseline the exterior arc is lifted by.
  private weaveReach() {
    const p = this.params;
    const swell = p.dynamicWeave ? WEAVE_SWELL_CAP : 0;
    return Math.hypot(p.ampH + swell, p.ampV + swell);
  }

  private get outRadius() {
    // Lift the exterior arc by the weave's radial reach, THEN add the separation gap, so the inner
    // edge of the (full-amplitude) weave keeps exactly `separation` world units off the wall —
    // separation is a pure offset, not a collision dodge. The per-frame headroom gate in rideCurve
    // is what actually GUARANTEES no penetration anywhere on the path.
    return GAME.CylinderRadius + this.weaveReach() + this.params.separation;
  }

  // --- lap chain -------------------------------------------------------------

  // Build the next lap as one centripetal Catmull-Rom from the persistent cruise point on the
  // exterior arc: tangential lead-in → exterior SWEEP around the wall to the entry (shortest
  // direction) → spiral IN to the entry opening → interior pass through the drum → spiral OUT of
  // the exit opening → tangential lead-out (= the next cruise point, so the seam is C1: shared point
  // AND tangent). Wall crossings are SPIRALS (angle eases toward the den while the radius moves
  // LINEARLY), so the tangent turns gradually — no corner/cusp at the hole — yet the crossing lands
  // exactly on the opening. Returns false (→ idle) if the player's segment has < 2 usable dens.
  private buildLap(map: any, playerY: number): boolean {
    const hop = pickHop(map.getActiveDens(), playerY, this.params, this.lastDen);
    if (!hop) { return false; }
    const entry = hop.entry;
    const exit = hop.target;
    this.entryDen = entry;
    this.targetDen = exit;

    const outR = this.outRadius;
    const R = GAME.CylinderRadius;
    const aEntry = denTheta(entry);
    const aExit = denTheta(exit);
    const ey = entry.body.position.y;
    const xy = exit.body.position.y;

    // Spiral/lead spans are world arc-lengths → angles (tight at any R, so the den cross is ~radial).
    const dir = this.spinDir;
    const spinAngle = SPIRAL_ARC / R;
    const leadAngle = LEAD_ARC / R;

    // First lap of a run: seed the cruise just before the entry (in the run's rotational sense) so
    // lap 0 is a short approach, no spurious full loop on spawn.
    if (this.state !== 'running') {
      this.cruiseTheta = aEntry - dir * FIRST_LAP_LEAD;
      this.cruiseY = ey;
    }

    // Work in a FORWARD-UNWRAPPED angle space so every sweep/spiral is monotonic in `dir`. Raw den
    // angles (denTheta) and the forward-accumulated cruiseTheta can differ by whole turns; lerping
    // from the accumulated angle to a raw angle would sweep backward by up to ~2π — a flip-back whose
    // control points loop across the wall. aEntryF/aExitF equal aEntry/aExit (mod 2π) so the WORLD
    // points are identical, but the interpolation now always advances forward.
    let fwdEntry = dir * (aEntry - this.cruiseTheta);
    fwdEntry = ((fwdEntry % TWO_PI) + TWO_PI) % TWO_PI;         // [0, 2π): den ahead = short, behind = full loop
    const aEntryF = this.cruiseTheta + dir * fwdEntry;
    let fwdExit = dir * (aExit - aEntry);
    fwdExit = ((fwdExit % TWO_PI) + TWO_PI) % TWO_PI;
    const aExitF = aEntryF + dir * fwdExit;                     // exit, forward of the entry

    // APPROACH (cruise → entry) as ONE strictly-forward ramp so it can never step backward: an
    // exterior sweep at outR, then a short dive (radius outR → R) over the final `diveSpan`, landing
    // exactly on the opening. No separate lead-in point — that could overshoot a nearby entry and
    // cause a small backward hitch. `diveSpan` compresses if the entry is closer than the spiral arc.
    const diveSpan = Math.min(spinAngle, fwdEntry);
    const aDiveStart = aEntryF - dir * diveSpan;
    const sweepSpan = fwdEntry - diveSpan;
    const v = () => new THREE.Vector3();
    const pts: THREE.Vector3[] = [];
    pts.push(cylToWorld(v(), this.cruiseTheta, this.cruiseY, outR));   // seam (shared with prev lap)
    // exterior sweep cruiseTheta → aDiveStart at outR, climbing cruiseY → entry height.
    if (sweepSpan > 1e-6) {
      const ns = Math.max(1, Math.round((sweepSpan * R) / SWEEP_STEP));
      for (let s = 1; s <= ns; s++) {
        const f = s / ns;
        pts.push(cylToWorld(v(), this.cruiseTheta + dir * sweepSpan * f,
          THREE.MathUtils.lerp(this.cruiseY, ey, f), outR));
      }
    }
    // dive IN: angle eases aDiveStart → aEntryF (ea = f(2−f), slow at the wall) while radius drops
    // linearly outR → R, landing radial on the opening.
    for (let s = 1; s <= SPIRAL_STEPS; s++) {
      const f = s / SPIRAL_STEPS; const ea = f * (2 - f);
      pts.push(cylToWorld(v(), THREE.MathUtils.lerp(aDiveStart, aEntryF, ea), ey,
        THREE.MathUtils.lerp(outR, R, f)));
    }
    // interior pass: entry → mid → exit, the mid pulled toward the cylinder axis (through the drum).
    const entryWorld = cylToWorld(v(), aEntryF, ey, R);
    const exitWorld = cylToWorld(v(), aExitF, xy, R);
    const mid = entryWorld.clone().lerp(exitWorld, 0.5);
    mid.x *= (1 - INTERIOR_PULL); mid.z *= (1 - INTERIOR_PULL); // toward the axis, keep height
    pts.push(entryWorld.clone().lerp(mid, 0.6));
    pts.push(mid);
    pts.push(exitWorld.clone().lerp(mid, 0.6));
    pts.push(exitWorld.clone());                                 // exit opening on the wall
    // spiral OUT: angle eases aExitF → aExitF+dir·spinAngle (ea = f²) while radius climbs R → outR,
    // ending tangential on the arc (sets up the next seam, same rotational sense).
    const aSpinOut = aExitF + dir * spinAngle;
    for (let s = 1; s <= SPIRAL_STEPS; s++) {
      const f = s / SPIRAL_STEPS; const ea = f * f;
      pts.push(cylToWorld(v(), THREE.MathUtils.lerp(aExitF, aSpinOut, ea), xy,
        THREE.MathUtils.lerp(R, outR, f)));
    }
    // tangential lead-out = next lap's cruise point (continues in the same rotational sense).
    this.cruiseTheta = aSpinOut + dir * leadAngle;
    this.cruiseY = xy;
    pts.push(cylToWorld(v(), this.cruiseTheta, this.cruiseY, outR));

    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    this.curve.arcLengthDivisions = 400;
    this.curve.updateArcLengths();
    this.curveLen = Math.max(1e-3, this.curve.getLength());
    denWorld(this.entryWall, entry, R);
    denWorld(this.targetWall, exit, R);
    return true;
  }

  // Place the head at the start of lap 0 and seed a straight tail behind it along −tangent(0), so
  // the body uncoils from a line instead of snapping. Only for the first lap of a run; chained laps
  // share the seam and keep the existing trail.
  private seedRide() {
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

    // Idle: no valid lap yet (fewer than 2 usable dens in the player's segment) — wait invisibly
    // and try to start a continuous run each frame.
    if (this.state === 'idle') {
      this.lastDen = null;
      this.spinDir = Math.random() < 0.5 ? -1 : 1;
      if (this.buildLap(map, playerPosition.y)) {
        this.state = 'running';
        this.seedRide();
        this.trailVersion += 1;
      } else {
        this.bodyMesh.visible = false;
        this.head.visible = false;
        this.bodyLine.visible = false;
        return;
      }
    }

    this.rideCurve(delta, map, playerPosition.y);

    // rideCurve nulls the curve (→ idle) if the next lap can't be built — stay hidden until dens return.
    if (!this.curve) {
      this.bodyMesh.visible = false;
      this.head.visible = false;
      this.bodyLine.visible = false;
      return;
    }

    this.updateBody();
    this.bodyMesh.visible = true;
    this.bodyLine.visible = true;
  }

  // Ride the current lap curve with the den-damped serpenoid weave; at the lap end immediately chain
  // the next lap from the shared seam (no drain, no hide). Grows the head's world trail.
  private rideCurve(delta: number, map: any, playerY: number) {
    if (!this.curve) { return; }
    const p = this.params;
    const g = gait(p, this.D.length);

    {
      // ease the advance through tight bends (uses last frame's smoothed curvature) so the head
      // doesn't whip around the spiral corners.
      const turnEase = 1 / (1 + TURN_EASE_K * Math.max(this.smYaw, this.smPit));
      const move = g.speed * delta * turnEase;
      this.headDist += move;
      this.lapDist += move;
      if (this.lapDist >= this.curveLen) {
        // chain: the next lap starts at this lap's lead-out (shared point + tangent → C1 seam).
        const leftover = this.lapDist - this.curveLen;
        this.lastDen = this.targetDen;
        if (!this.buildLap(map, playerY)) { this.state = 'idle'; this.curve = null; return; }
        this.lapDist = Math.min(leftover, this.curveLen);
        this.trailVersion += 1;
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
      const denGain = smoothstep(dDen, DEN_OPENING_RADIUS * 1.15, p.denFade);

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

      // HARD no-collision gate: the weave's max radial excursion is gain·hypot(aH, aV) (the range of
      // motion derived above). Cap the gain so that excursion can never exceed the local radial
      // headroom (baseRadius − R) ⇒ head radius ≥ R for ANY amps. On the exterior arc baseRadius =
      // R + reach + separation ⇒ headroomGain ≥ 1 (full weave, clearance = separation); approaching a
      // den (baseRadius → R) or inside it ⇒ gain → 0 (clean radial thread, no weave). Combined with
      // the den-distance damp so the weave still flattens right at each opening.
      const baseRadius = Math.hypot(this._base.x, this._base.z);
      const reach = Math.max(1e-3, Math.hypot(aH, aV));
      const headroomGain = clamp((baseRadius - GAME.CylinderRadius) / reach, 0, 1);
      const gain = Math.min(denGain, headroomGain);

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

  // Bead count that makes bodyRadius and bodyLength work together: pick the most beads whose spacing
  // (segLen = bodyLength / N) is still ≥ the head's DIAMETER (2·bodyRadius), so neighbouring spheres
  // touch at most — never overlap. Capped by the allocated instance budget (this.D.length); that cap
  // only ever INCREASES the spacing, so the no-overlap invariant holds there too. Taper shrinks the
  // tail spheres, so if the head pair clears, every pair clears.
  private beadCount() {
    const { bodyLength, bodyRadius } = this.params;
    const diameter = 2 * Math.max(1e-3, bodyRadius);
    return Math.max(2, Math.min(this.D.length, Math.floor(bodyLength / diameter)));
  }

  // Body = the head's world trail resampled at uniform arc length behind it. Beads inside the
  // wall collapse (hidden). Sets bodyVisible (any bead outside the wall).
  private updateBody() {
    const N = this.beadCount();
    const wall = GAME.CylinderRadius;
    const segLen = Math.max(0.02, this.params.bodyLength / N);
    resampleTrail(this.trail, N, segLen, this.D);

    // Light Laplacian smoothing (2 passes) to relax any residual kink at the spiral crossings.
    // Skip beads near a den so the threading through the openings stays exact.
    if (this.state === 'running') {
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
    // Only draw the N beads we placed this frame (N varies with bodyRadius/bodyLength).
    this.bodyMesh.count = N;
    this.bodyLine.geometry.setDrawRange(0, N);
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    if (this.bodyMesh.instanceColor) { this.bodyMesh.instanceColor.needsUpdate = true; }
    this.bodyLine.geometry.attributes.position.needsUpdate = true;
    this.updateHeadMesh(N);
  }

  private updateHeadMesh(N: number) {
    const { head } = this;
    const hp = this.D[0];
    head.position.copy(hp);
    this._fwd.copy(hp).sub(this.D[Math.min(2, N - 1)]);
    if (this._fwd.lengthSq() > 1e-8) { head.quaternion.setFromUnitVectors(WUP, this._fwd.normalize()); }
    head.visible = worldRadius(hp) > GAME.CylinderRadius - 1;
  }
}
