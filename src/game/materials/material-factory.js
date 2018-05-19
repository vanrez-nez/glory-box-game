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
import CollectibleTrailMaterial from './collectible-trail-material';
import PlayerMaterial from './player-material';

const DEFAULT = {};
const MATERIALS = {
  PlayerMaterial,
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  WorldSkyCylinder: WorldSkyCylinderMaterial,
  PlatformLight: PlatformLightMaterial,
  PlatformSteps: PlatformStepsMaterial,
  PlatformSocket: PlatformSocketMaterial,
  CollectibleSocket: CollectibleSocketMaterial,
  CollectibleGlyph: CollectibleGlyphMaterial,
  CollectibleItem: CollectibleItemMaterial,
  CollectibleTrail: CollectibleTrailMaterial,
};

export default class GameMaterialFactory {
  constructor(opts) {
    this.materialsCache = {};
    this.opts = { ...DEFAULT, ...opts };
  }

  getMaterial(materialName, params, cacheId = null) {
    const { materialsCache } = this;
    let material;
    if (MATERIALS[materialName]) {
      const useCache = cacheId !== null;
      let cacheHash = '';
      if (useCache) {
        cacheHash = `${materialName}_${cacheId}`;
        material = this.materialsCache[cacheHash];
      }
      if (!material) {
        material = new MATERIALS[materialName](params);
        if (useCache) {
          this.materialsCache[cacheHash] = material;
        }
      }
      return material.getMaterial(CONFIG.MaterialQuality);
    } else {
      return new THREE.MeshBasicMaterial();
    }
  }
}

export const MaterialFactoryInstance = new GameMaterialFactory({});
