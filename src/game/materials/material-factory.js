import { CONFIG } from '../const';
import { GroupBy } from '../utils';
import WorldFloorMaterial from './world-floor-material';
import WorldCylinderMaterial from './world-cylinder-material';
import WorldSkyCylinderMaterial from './world-sky-cylinder-material';
import WorldFxCylinderMaterial from './world-fx-cylinder-material';
import PlatformSocketMaterial from './platform-socket-material';
import PlatformLightMaterial from './platform-light-material';
import PlatformStepsMaterial from './platform-steps-material';
import CollectibleSocketMaterial from './collectible-socket-material';
import CollectibleGlyphMaterial from './collectible-glyph-material';
import CollectibleItemMaterial from './collectible-item-material';
import EnemyVortexMaterial from './enemy-vortex-material';
import EnemyHeadMaterial from './enemy-head-material';
import EnemyArmorMaterial from './enemy-armor-material';
import EnemyEyesMaterial from './enemy-eyes-material';
import GenericColorMaterial from './generic-color-material';
import GenericTrailMaterial from './generic-trail-material';
import EnemyRayMaterial from './enemy-ray-material';
import PlayerHitFxMaterial from './player-hit-fx-material';
import PlayerMaterial from './player-material';
import PlayerHudFireballMaterial from './player-hud-fireball-material';

const DEFAULT = {};
const MATERIALS = {
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  WorldSkyCylinder: WorldSkyCylinderMaterial,
  WorldFxCylinder: WorldFxCylinderMaterial,
  PlatformLight: PlatformLightMaterial,
  PlatformSteps: PlatformStepsMaterial,
  PlatformSocket: PlatformSocketMaterial,
  CollectibleSocket: CollectibleSocketMaterial,
  CollectibleGlyph: CollectibleGlyphMaterial,
  CollectibleItem: CollectibleItemMaterial,
  EnemyVortex: EnemyVortexMaterial,
  EnemyRay: EnemyRayMaterial,
  EnemyHead: EnemyHeadMaterial,
  EnemyArmor: EnemyArmorMaterial,
  EnemyEyes: EnemyEyesMaterial,
  GenericTrail: GenericTrailMaterial,
  GenericColor: GenericColorMaterial,
  PlayerMaterial,
  PlayerHitFx: PlayerHitFxMaterial,
  PlayerHudFireball: PlayerHudFireballMaterial,
};

export default class GameMaterialFactory {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.materialsCache = {};
    this.instances = [];
  }

  getMaterial(materialName, params, cacheId = null) {
    const { materialsCache } = this;
    let material;
    if (MATERIALS[materialName]) {
      const useCache = cacheId !== null;
      let cacheHash = '';
      if (useCache) {
        cacheHash = `${materialName}_${cacheId}`;
        material = materialsCache[cacheHash];
      }
      if (!material) {
        material = new MATERIALS[materialName](params);
        this.instances.push(material);
        if (useCache) {
          materialsCache[cacheHash] = material;
        }
      }
      return material.getMaterial(CONFIG.MaterialQuality);
    } else {
      return new THREE.MeshBasicMaterial();
    }
  }

  getMaterialsByNodeName() {
    return GroupBy(this.instances, obj => obj.opts.nodeName);
  }

  getMaterialsByMaterialType() {
    return GroupBy(this.instances, obj => obj.constructor.name);
  }
}

export const MaterialFactoryInstance = new GameMaterialFactory({});
