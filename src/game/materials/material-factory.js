import { CONFIG } from '../const';
import WorldFloorMaterial from './world-floor';
import WorldCylinderMaterial from './world-cylinder';
import PlatformSocketMaterial from './platform-socket';
import PlatformLightMaterial from './platform-light';
import PlatformStepsMaterial from './platform-steps';
import CollectibleSocketMaterial from './collectible-socket';
import CollectibleGlyphMaterial from './collectible-glyph';
import CollectibleItemMaterial from './collectible-item';

const DEFAULT = {};
const MATERIALS = {
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  PlatformLight: PlatformLightMaterial,
  PlatformSteps: PlatformStepsMaterial,
  PlatformSocket: PlatformSocketMaterial,
  CollectibleSocket: CollectibleSocketMaterial,
  CollectibleGlyph: CollectibleGlyphMaterial,
  CollectibleItem: CollectibleItemMaterial,
};

export default class GameMaterialFactory {
  constructor(opts) {
    this.materials = [];
    this.opts = { ...DEFAULT, ...opts };
  }

  getMaterial(materialName, params) {
    let material;
    if (MATERIALS[materialName]) {
      material = new MATERIALS[materialName](params);
      return material.getMaterial(CONFIG.MaterialQuality);
    } else {
      return new THREE.MeshBasicMaterial();
    }
  }
}

export const MaterialFactoryInstance = new GameMaterialFactory({});
