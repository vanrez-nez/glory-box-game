import * as THREE from 'three';

/*
  Disable three.js automatic sRGB color management so the game keeps the same
  linear-output look it had on three r99 (pre color-management era). Must run
  before any material/texture is created. Imported first in main.js.
*/
THREE.ColorManagement.enabled = false;
