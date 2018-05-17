import { CONFIG } from '../const';
import WorldFloorMaterial from './world-floor-material';
import WorldCylinderMaterial from './world-cylinder-material';
import WorldSkyCylinderMaterial from './world-sky-cylinder-material';
import PlatformSocketMaterial from './platform-socket-material';
import PlatformLightMaterial from './platform-light-material';
import PlatformStepsMaterial from './platform-steps-material';
import CollectibleSocketMaterial from './collectible-socket-material';
import CollectibleGlyphMaterial from './collectible-glyph-material';
import CollectibleItemMaterial from './collectible-item-material';
import PlayerMaterial from './player-material';

const DEFAULT = {};
const MATERIALS = {
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  WorldSkyCylinder: WorldSkyCylinderMaterial,
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
