import { CONFIG } from '../const';
import WorldFloorMaterial from './world-floor';
import WorldCylinderMaterial from './world-cylinder';
import PlatformSocketMaterial from './platform-socket';
import PlatformLightMaterial from './platform-light';
import PlatformStepsMaterial from './platform-steps';

const DEFAULT = {};
const MATERIALS = {
  WorldCylinder: WorldCylinderMaterial,
  WorldFloor: WorldFloorMaterial,
  PlatformLight: PlatformLightMaterial,
  PlatformSteps: PlatformStepsMaterial,
  PlatformSocket: PlatformSocketMaterial,
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
