import * as THREE from 'three/webgpu';
import { QUALITY } from '@/game/const';

const DEV_CONFIG = {
  EnableTools: true,
  EnableStats: true,
  EnableOrbitControls: false,
  EnableAxes: false,
  DebugCollisions: false,
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
  return o;
}

export const GameConfigInstance = setupGetters(new GameConfig());
