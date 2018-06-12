export const QUALITY = {
  Low: 0,
  Medium: 1,
  High: 2,
};

export const CONFIG = {
  EnableTools: false,
  EnableStats: false,
  EnableOrbitControls: false,
  EnableAxes: false,
  DebugCollisions: false,
  UsePostProcessing: true,
  EnableShadows: false,
  ToneMapping: THREE.NoToneMapping,
  EnableSkyShader: false,
  MaterialQuality: QUALITY.Low,
};

export const GAME = {
  CilynderRadius: 35,
  HudDistanceFromCamera: 20,
  PlatformOffset: 2.45,
  CollectibleSocketOffset: 0,
  CollectibleItemOffset: 1.9,
  PlayerOffset: 2.45,
  EnemyOffset: 4,
  CameraDistance: 50,
  ZoomCameraDistance: 150,
  PlatformZSize: 2,
  BoundsLeft: -128,
  BoundsRight: 128,
  BoundsBottom: -16,
  BoundsTop: Infinity,
};

export const KEYBOARD_BINDINGS = {
  Jump: [38, 32], // space, arrow up
  Left: [37],
  Right: [39],
};

export const EVENTS = {
  CollisionBegan: 'ECollisionBegan',
  CollisionEnded: 'ECollisionEnded',
  CollectiblePickup: 'ECollectiblePickUp',
  CollectibleCollect: 'ECollectibleCollect',
  SteeringTrailLanded: 'ESteeringTrailLanded',
  EnemyRayHit: 'EEnemyRayHit',
  PlayerDeath: 'EPlayerDeath',
};

export const PHYSICS = {
  CollisionBias: 0.001,
  Generic: 0,
  Player: 1,
  EnemyRay: 2,
  WorldBounds: 3,
  StaticPlatform: 4,
  MovingPlatform: 5,
  Collectible: 6,
  Particle: 7,
};

export const DIRECTIONS = {
  None: 0,
  Up: 1,
  Right: 2,
  Down: 3,
  Left: 4,
};

export const MAP = {
  Empty: 0,
  StaticPlatform: 1,
  MovingPlatform: 2,
  Glyph: 3,
};

export const COLLECTIBLE = {
  Honor: 0,
  Courage: 1,
  Destiny: 2,
  Strength: 3,
  Peace: 4,
  Love: 5,
  Energy: 6,
  Difficulty: 7,
  Happiness: 8,
};
