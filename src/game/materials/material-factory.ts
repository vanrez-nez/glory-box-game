import * as THREE from 'three/webgpu';
import { groupBy } from 'lodash';
import GameMetaMaterial from '@/game/materials/meta-material';
import { MATERIAL_DEFS } from '@/game/materials/material-definitions';

const DEFAULT = {};

export default class GameMaterialFactory {
  opts!: Record<string, any>;
  materialsCache!: Record<string, any>;
  instances!: any[];
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.materialsCache = {};
    this.instances = [];
  }

  clear() {
    this.materialsCache = {};
    this.instances.forEach(instance => instance.dispose());
    this.instances = [];
  }

  getMaterial(materialName: any, params?: any, cacheId: any = null) {
    const { materialsCache } = this;
    let material;
    const def = MATERIAL_DEFS[materialName];
    if (def) {
      const useCache = cacheId !== null;
      let cacheHash = '';
      if (useCache) {
        cacheHash = `${materialName}_${cacheId}`;
        material = materialsCache[cacheHash];
      }
      if (!material) {
        material = new GameMetaMaterial(def(params));
        material.materialType = materialName;
        this.instances.push(material);
        if (useCache) {
          materialsCache[cacheHash] = material;
        }
      }
      return material.getMaterial();
    } else {
      return new THREE.MeshBasicMaterial();
    }
  }

  getMaterialsByNodeName() {
    return groupBy(this.instances, obj => obj.opts.nodeName);
  }

  getMaterialsByMaterialType() {
    return groupBy(this.instances, obj => obj.materialType);
  }
}

export const MaterialFactoryInstance = new GameMaterialFactory({});
