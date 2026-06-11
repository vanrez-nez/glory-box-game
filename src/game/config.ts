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
export const DRAGON = {
  speed: 22,           // head travel speed along its path (units/sec)
  amplitude: 3.5,      // serpentine undulation amplitude (vertical)
  wavelength: 16,      // undulation wavelength (arc units)
  waveSpeed: 3,        // undulation temporal speed
  bodyLength: 40,      // arc length the body spans behind the head
  circleHeight: 5,     // radial offset above the wall while circling
  bodySep: 7,          // attack: radial offset of the body above the wall
  headDist: 1.5,       // attack: radial offset of the head (stays visible, near wall)
  bendLength: 26,      // attack: how many front segments arc inward
  hiddenDwell: 2.5,    // seconds hidden between appearances (appearance cadence)
  activeDuration: 6,   // seconds spent out before diving back in
  emergeTime: 1.0,     // seconds to rise out of a den
  diveTime: 1.2,       // seconds to sink into a den
  attackWeight: 0.5,   // probability an appearance is an attack (vs circle)
  aimLag: 0.8,         // seconds of player-path lag the attack aims at
  forceBehavior: 1,    // dev: 0 = random, 1 = force circle (wander), 2 = force attack
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
