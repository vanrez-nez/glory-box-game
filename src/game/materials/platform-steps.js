import { IMAGE_ASSETS } from '../assets';
import { GetTextureRepeatDefer } from '../utils';
import { StaticInstance as Skybox } from '../skybox';
import GameMetaMaterial from './meta-material';

export default class PlatformStepsMaterial extends GameMetaMaterial {
  constructor(opts) {
    const width = opts.width * 0.15;
    super({
      low: {
        type: 'MeshBasicMaterial',
        args: {
          // map: GetTextureRepeatDefer(IMAGE_ASSETS.ImpFloorBase, width, 0.5),
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          map: GetTextureRepeatDefer(IMAGE_ASSETS.ImpFloorBase, width, 0.5),
          roughnessMap: GetTextureRepeatDefer(IMAGE_ASSETS.ImpFloorRoughness, width, 0.5),
          normalMap: GetTextureRepeatDefer(IMAGE_ASSETS.ImpFloorNormal, width, 0.5),
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
