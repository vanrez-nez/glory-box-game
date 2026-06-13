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
// Gait-first serpenoid controller (see enemy/dragon-serpentine.ts + enemy-dragon.ts):
// a sinusoid drives the HEAD's heading, the head writes a world trail, the body follows
// the trail at fixed arc spacing. No precomputed rail. Amplitudes are world-unit
// semi-amplitudes converted to angular swing internally (ψ = 2π·a / wavelength, capped).
export const DRAGON = {
  speed: 22,           // base forward speed (world units/sec, before wiggle compensation)
  amplitude: 3.5,      // lateral serpentine semi-amplitude (world units)
  wavelength: 16,      // serpentine wavelength λ (world units) — sets waves along the body
  bodyLength: 40,      // world length the body spans behind the head (= N·L)
  bodyRadius: 0.7,     // body sphere radius at the shoulders (tapers toward the tail)
  circleHeight: 5,     // radial offset beyond the wall while travelling (out radius = R + this)
  hiddenDwell: 2.5,    // seconds hidden between appearances (cadence)
  // --- steering ---
  agility: 1.6,        // proportional turn gain toward the target (capped by maxTurn)
  maxTurn: 2.0,        // rad/sec cap on how fast the heading can bank/pitch
  arrivalRadius: 2.0,  // distance to the target den that triggers the dive
  // --- emerge / dive smoothing (sigmoid amplitude + radius envelopes) ---
  emergeTime: 0.6,     // seconds to ramp amplitude 0→full + radius hidden→out on emerge
  diveTime: 0.6,       // seconds to ramp amplitude full→0 + radius out→hidden on dive
  // --- den-to-den goals (see enemy/dragon-serpentine.ts) ---
  playerYSigma: 32,    // entry-den weighting: Gaussian sigma (world-y) toward player
  maxHops: 1,          // dens threaded per appearance (1 = emerge→dive→hide; >1 chains via
                       // a hidden under-wall 'transit' — see enemy-dragon, needs convergence
                       // tuning before raising the default)
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
