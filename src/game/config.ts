import * as THREE from 'three/webgpu';

const DEV_CONFIG = {
  EnableTools: true,
  EnableStats: true,
  EnableOrbitControls: false,
  EnableAxes: false,
  DebugCollisions: false,
  // Static design mode: detach the camera from the player (free orbit) and
  // freeze the world so the cylinder layout can be inspected. Implies orbit
  // controls. Dev-mode only.
  StaticDesign: false,
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

export class GameConfig {
  developerMode!: boolean;
  constructor() {
    this.developerMode = false;
  }

  set(developerMode: any) {
    this.developerMode = developerMode;
  }

  // Runtime toggle for edit mode (free camera + frozen world). The StaticDesign
  // getter reads DEV_CONFIG, so flipping it here flips the getter (dev-mode gated).
  setStaticDesign(on: boolean) {
    DEV_CONFIG.StaticDesign = on;
  }
}

// dynamically assign all object keys from DEV_CONFIG, RENDER and WORLD
// as getters of the object
function setupGetters(o: any) {
  Object.keys(DEV_CONFIG).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (DEV_CONFIG as any)[key] && this.developerMode; },
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
