import { IMAGE_ASSETS } from '@/game/assets';

import { StaticInstance as Skybox } from '@/game/skybox';
import GameMetaMaterial from '@/game/materials/meta-material';

export default class PlatformStepsMaterial extends GameMetaMaterial {
  constructor(opts) {
    const width = opts.width * 0.15;
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
          // map: GetTextureRepeatDefer(IMAGE_ASSETS.ImpFloorBase, width, 0.5),
        },
      },
      medium: {
        type: 'MeshLambertMaterial',
        args: {
          envMap: Skybox.textureCube,
          reflectivity: 0.35,
          color: opts.color,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorBase, width, 0.5),
          roughnessMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorRoughness, width, 0.5),
          normalMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.ImpFloorNormal, width, 0.5),
          envMap: Skybox.textureCube,
          envMapIntensity: 0.2,
          metalness: 0.5,
          roughness: 0.7,
          flatShading: true,
          color: 0xffffff,
        },
      },
    });
  }
}
