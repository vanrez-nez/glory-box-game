import { IMAGE_ASSETS } from '../assets';
import { StaticInstance as Skybox } from '../skybox';
import GameMetaMaterial from './meta-material';

export default class WorldFloorMaterial extends GameMetaMaterial {
  constructor(opts) {
    const scale = opts.scale;
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          // envMap: Skybox.textureCube,
          color: 0x484b57,
          flatShading: true,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorBase, scale, scale),
          wireframe: false,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          color: 0x6082b6,
          envMap: Skybox.textureCube,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorBase, scale, scale),
          normalMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorNormal, scale, scale),
          roughnessMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorRoughness, scale, scale),
          metalness: 0.69,
          roughness: 0.22,
          envMapIntensity: 0.18,
        },
      },
    });
  }
}
