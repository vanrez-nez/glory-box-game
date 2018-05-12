export const CONFIG = {
  EnableTools: true,
  EnableStats: true,
  EnableOrbitControls: false,
  EnableAxes: false,
  DebugCollisions: false,
  UsePostProcessing: true,
  PositionCullingEnabled: true,
};

export const GAME = {
  CilynderRadius: 35,
  PlatformDistance: 37.25,
  CameraDistance: 80,
  PlatformZSize: 2,
  PlayerDistance: 37.3,
  BoundsLeft: -128,
  BoundsRight: 128,
  BoundsBottom: -16,
  BoundsTop: Infinity,
  CullingMaxDistance: 100,
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
};

export const PHYSICS = {
  CollisionBias: 0.001,
  Player: 'PHYSICS.Player',
  WorldBounds: 'WorldBounds',
  StaticPlatform: 'PHYSICS.StaticPlatform',
  MovingPlatform: 'PHYSICS.MovingPlatform',
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
