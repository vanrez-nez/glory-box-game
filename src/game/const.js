export const MATERIAL = {
  QualityLow: 0,
  QualityMedium: 1,
  QualityHigh: 2,
};

export const CONFIG = {
  EnableTools: false,
  EnableStats: true,
  EnableOrbitControls: false,
  EnableAxes: false,
  DebugCollisions: false,
  UsePostProcessing: false,
  PositionCullingEnabled: true,
  EnableShadows: false,
  ToneMapping: THREE.NoToneMapping,
  MaterialQuality: MATERIAL.QualityLow,
};

export const GAME = {
  CilynderRadius: 35,
  PlatformOffset: 2.25,
  CollectibleSocketOffset: 0,
  CollectibleItemOffset: 1.9,
  PlayerOffset: 2.25,
  EnemyOffset: 4,
  CameraDistance: 40,
  ZoomCameraDistance: 150,
  PlatformZSize: 2,
  BoundsLeft: -128,
  BoundsRight: 128,
  BoundsBottom: -16,
  BoundsTop: Infinity,
  CullingMaxDistance: 50,
  CullingMaxNodes: 100,
  CullingUpdateRate: 20,
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
};

export const PHYSICS = {
  CollisionBias: 0.001,
  Player: 'PHYSICS.Player',
  WorldBounds: 'WorldBounds',
  StaticPlatform: 'PHYSICS.StaticPlatform',
  MovingPlatform: 'PHYSICS.MovingPlatform',
  Collectible: 'PHYSICS.Collectible',
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
