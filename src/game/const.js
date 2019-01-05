import {
  KEYBOARD,
  GAMEPAD_BUTTONS,
} from '@/common/input-manager';

export const QUALITY = {
  Low: 0,
  Medium: 1,
  High: 2,
};

export const GAME = {
  CilynderRadius: 35,
  HudDistanceFromCamera: 10,
  PlatformOffset: 2.45,
  CollectibleSocketOffset: 0,
  CollectibleItemOffset: 1.9,
  PlayerOffset: 2.45,
  EnemyOffset: 5,
  CameraDistance: 35,
  ZoomCameraDistance: 150,
  PlatformZSize: 2,
  BoundsLeft: -128,
  BoundsRight: 128,
  BoundsBottom: -16,
  BoundsTop: Infinity,
};


export const GAMEPAD_CONTROLS = {
  Jump: [GAMEPAD_BUTTONS.A],
  Left: [GAMEPAD_BUTTONS.DpadLeft],
  Right: [GAMEPAD_BUTTONS.DpadRight],
};

export const KEYBOARD_CONTROLS = {
  Jump: [KEYBOARD.Space, KEYBOARD.ArrowUp],
  Left: [KEYBOARD.ArrowLeft],
  Right: [KEYBOARD.ArrowRight],
};

export const EVENTS = {
  GameReady: 'EGameReady',
  GamePause: 'EGamePause',
  GameRestart: 'EGameRestart',
  GameResume: 'EGameResume',
  MapChunkLoaded: 'EMapChunkLoaded',
  MapChunkUnloaded: 'EMapChunkUnloaded',
  CollisionBegan: 'ECollisionBegan',
  CollisionEnded: 'ECollisionEnded',
  CollectiblePickup: 'ECollectiblePickUp',
  CollectibleCollect: 'ECollectibleCollect',
  SteeringTrailLanded: 'ESteeringTrailLanded',
  EnemyRayHit: 'EEnemyRayHit',
  EnemyDragonHit: 'EEnemyDragonHit',
  PlayerDeath: 'EPlayerDeath',
};

export const PHYSICS = {
  CollisionBias: 0.001,
  Generic: 0,
  Player: 1,
  EnemyRay: 2,
  EnemyDragon: 3,
  WorldBounds: 4,
  StaticPlatform: 5,
  MovingPlatform: 6,
  Collectible: 7,
  Particle: 8,
};

export const LEVELS = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
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
