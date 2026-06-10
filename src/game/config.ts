import * as THREE from 'three/webgpu';
import { QUALITY } from '@/game/const';

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

const QUALITY_LEVELS = {
  low: {
    UsePostProcessing: false,
    EnableShadows: false,
    ToneMapping: THREE.LinearToneMapping,
    EnableSkyShader: false,
    MaterialQuality: QUALITY.Low,
    SceneQuality: QUALITY.Low,
    PixelRatioMultiplier: 0.5,
  },
  medium: {
    UsePostProcessing: false,
    EnableShadows: false,
    ToneMapping: THREE.LinearToneMapping,
    EnableSkyShader: false,
    MaterialQuality: QUALITY.Medium,
    SceneQuality: QUALITY.Medium,
    PixelRatioMultiplier: 0.8,
  },
  high: {
    UsePostProcessing: true,
    EnableShadows: true,
    ToneMapping: THREE.LinearToneMapping,
    EnableSkyShader: true,
    MaterialQuality: QUALITY.High,
    SceneQuality: QUALITY.High,
    PixelRatioMultiplier: 1,
  },
};

export class GameConfig {
  developerMode!: boolean;
  qualityNode!: string;
  constructor() {
    this.developerMode = false;
    this.qualityNode = 'low';
  }

  set(quality: any, developerMode: any) {
    this.developerMode = developerMode;
    if (quality in QUALITY_LEVELS) {
      this.qualityNode = quality;
    }
  }

  // Runtime toggle for edit mode (free camera + frozen world). The StaticDesign
  // getter reads DEV_CONFIG, so flipping it here flips the getter (dev-mode gated).
  setStaticDesign(on: boolean) {
    DEV_CONFIG.StaticDesign = on;
  }
}

// dynamically assign all object keys from DEV_CONFIG and
// QUALITY_LEVELS as getters of the object
function setupGetters(o: any) {
  Object.keys(DEV_CONFIG).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (DEV_CONFIG as any)[key] && this.developerMode; },
    });
  });
  // take the keys from low config
  Object.keys(QUALITY_LEVELS.low).forEach((key) => {
    Object.defineProperty(o, key, {
      get() { return (QUALITY_LEVELS as any)[this.qualityNode][key]; },
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
