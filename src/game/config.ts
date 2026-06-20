import * as THREE from 'three/webgpu';

// Plain game-side debug flags (editor/dev features live in src/editor now).
const DEV_CONFIG = {
  // Wireframe colliding bodies (read in utils.ts SyncBodyPhysicsMesh). The dev
  // editor may flip it; default off.
  DebugCollisions: false,
};

// Ungated numeric world tuning (not dev/quality gated). The cylinder wrap is
// derived from these: a MapWidth-wide map is wrapped around CylinderWrapAngle
// radians. CylinderWrapAngle = 2*PI wraps the full circle; PI reproduces the
// legacy 180-degree (front-half) layout.
const WORLD = {
  MapWidth: 128,
  CylinderWrapAngle: Math.PI * 2,
  // Extra invisible collision width (world units, total — split across both edges)
  // added to a platform's contact footprint beyond its visible pad, so the player
  // doesn't drop off exactly at the visual edge (forgiveness margin).
  PlatformContactThreshold: 1,
};

// Single rendering baseline (formerly the "high" quality tier). The game no
// longer ships multiple levels of detail; these remain individually
// configurable feature toggles — they are just no longer bundled into
// low/medium/high levels.
const RENDER = {
  UsePostProcessing: true,
  EnableShadows: true,
  ToneMapping: THREE.LinearToneMapping,
  // The visible sky is the third-party skybox runtime (see skybox.ts). The old
  // nebula sky-cylinder (w_skyc / WorldSkyCylinder) is gated by this flag and
  // stays off so it doesn't double up with the skybox backdrop.
  EnableSkyShader: false,
  PixelRatioMultiplier: 1,
};

// Dragon movement/pose tuning. Copied into a mutable `params` on the dragon at
// construction and bound to the "Dragon" tweakpane screen for live tuning.
// Distances are world units (the wall sits at GAME.CylinderRadius = 35); times
// are seconds.
// Path-first serpenoid-gait controller (ported from the user's reference HTML; see
// enemy-dragon.ts + enemy/dragon-serpentine.ts). One appearance = one threaded lap: the head
// rides a CatmullRomCurve3 that passes EXACTLY through the entry + target den openings, and the
// serpenoid weave is a positional offset (two axes) damped to ~0 at each opening, so the curve
// threads the holes by construction. The body is the head's resampled trail. Amplitudes are
// world-unit semi-amplitudes (≈ ×7 the reference's R=5 values for this R=35 cylinder); these are
// STARTING values to dial in the pane, not claimed-correct.
export const DRAGON = {
  // --- serpenoid weave (positional offset on the curve) ---
  ampH: 2.5,           // lateral (around-the-wall) weave semi-amplitude (world units)
  ampV: 1.5,           // normal (in/out of the wall) weave semi-amplitude (world units)
  delta: Math.PI / 2,  // phase offset between the two weave axes (π/2 = figure-eight roll)
  k: 0.2,              // phase lag → number of waves along the body (waves ≈ beadCount·k/2π)
  omega: 2.6,          // gait frequency → forward speed (speed = SPEED_K·ω / loss)
  denFade: 14,         // weave-damp window: flat at the opening (≤ DENR·1.15) → full by denFade
  // --- curvature-driven weave (reference's "turn-driven" mode): the weave swells in gentle
  // turns and is suppressed (per cross-axis) in sharp ones, smoothed + capped so a bend can't
  // blow it up. Curvature is normalised by R so these are scale-invariant. ---
  dynamicWeave: true,  // off = constant ampH/ampV; on = curvature-modulated
  turnAmp: 0.7,        // how much the weave swells with turn sharpness
  suppress: 0.85,      // how much cross-axis sharpness damps an axis (0..1)
  // --- body ---
  bodyLength: 40,      // world length the body spans behind the head (= beadCount·L)
  bodyRadius: 0.7,     // body sphere radius at the shoulders (tapers toward the tail)
  separation: 1.5,     // clearance (world units) the weave's inner envelope keeps off the wall
                       // (exterior-arc out-radius = R + weave reach + this; see enemy-dragon.outRadius)
  // --- den selection (see enemy/dragon-serpentine.ts) ---
  playerYSigma: 32,    // entry-den weighting: Gaussian sigma (world-y) toward player
};

// Holds no state now (dev/editor gating moved to src/editor); the getters below
// expose the config tables as a singleton.
export class GameConfig {}

// dynamically assign all object keys from DEV_CONFIG, RENDER and WORLD
// as getters of the object
function setupGetters(o: any) {
  Object.keys(DEV_CONFIG).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (DEV_CONFIG as any)[key]; },
    });
  });
  // single render baseline (ungated render feature toggles)
  Object.keys(RENDER).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (RENDER as any)[key]; },
    });
  });
  // ungated numeric world values
  Object.keys(WORLD).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (WORLD as any)[key]; },
    });
  });
  // derived: radians of cylinder arc per 1 unit of map-x
  Object.defineProperty(o, 'ThetaPerUnit', {
    get() { return WORLD.CylinderWrapAngle / WORLD.MapWidth; },
  });
  // derived: the map covers the full circle, so player x loops continuously
  // (physics wraps modulo MapWidth instead of clamping at left/right walls).
  Object.defineProperty(o, 'WrapAround', {
    get() { return WORLD.CylinderWrapAngle >= Math.PI * 2 - 0.0001; },
  });
  return o;
}

export const GameConfigInstance = setupGetters(new GameConfig());
