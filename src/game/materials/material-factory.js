import { groupBy } from 'lodash';
import { GameConfigInstance as GameConfig } from '@/game/config';
import WorldFloorMaterial from '@/game/materials/world-floor-material';
import WorldCylinderMaterial from '@/game/materials/world-cylinder-material';
import WorldSkyCylinderMaterial from '@/game/materials/world-sky-cylinder-material';
import WorldFxCylinderMaterial from '@/game/materials/world-fx-cylinder-material';
import PlatformSocketMaterial from '@/game/materials/platform-socket-material';
import PlatformLightMaterial from '@/game/materials/platform-light-material';
import PlatformStepsMaterial from '@/game/materials/platform-steps-material';
import CollectibleSocketMaterial from '@/game/materials/collectible-socket-material';
import CollectibleGlyphMaterial from '@/game/materials/collectible-glyph-material';
import CollectibleItemMaterial from '@/game/materials/collectible-item-material';
import EnemyVortexMaterial from '@/game/materials/enemy-vortex-material';
import EnemyVortexParticleMaterial from '@/game/materials/enemy-vortex-particle-material';
import EnemyHeadMaterial from '@/game/materials/enemy-head-material';
import EnemyArmorMaterial from '@/game/materials/enemy-armor-material';
import EnemyEyesMaterial from '@/game/materials/enemy-eyes-material';
import GenericColorMaterial from '@/game/materials/generic-color-material';
import GenericTrailMaterial from '@/game/materials/generic-trail-material';
import EnemyRayMaterial from '@/game/materials/enemy-ray-material';
import PlayerHitFxMaterial from '@/game/materials/player-hit-fx-material';
import PlayerMaterial from '@/game/materials/player-material';
import PlayerHudFireballMaterial from '@/game/materials/player-hud-fireball-material';
import WorldCheckpointRingMaterial from '@/game/materials/world-checkpoint-ring-material';

const DEFAULT = {};
const MATERIALS = {
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  WorldSkyCylinder: WorldSkyCylinderMaterial,
  WorldFxCylinder: WorldFxCylinderMaterial,
  WorldCheckpointRing: WorldCheckpointRingMaterial,
  PlatformLight: PlatformLightMaterial,
  PlatformSteps: PlatformStepsMaterial,
  PlatformSocket: PlatformSocketMaterial,
  CollectibleSocket: CollectibleSocketMaterial,
  CollectibleGlyph: CollectibleGlyphMaterial,
  CollectibleItem: CollectibleItemMaterial,
  EnemyVortex: EnemyVortexMaterial,
  EnemyVortexParticle: EnemyVortexParticleMaterial,
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

  clear() {
    this.materialsCache = {};
    this.instances.forEach(instance => instance.dispose());
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
      return material.getMaterial(GameConfig.MaterialQuality);
    } else {
      return new THREE.MeshBasicMaterial();
    }
  }

  getMaterialsByNodeName() {
    return groupBy(this.instances, obj => obj.opts.nodeName);
  }

  getMaterialsByMaterialType() {
    return groupBy(this.instances, obj => obj.constructor.name);
  }
}

export const MaterialFactoryInstance = new GameMaterialFactory({});
