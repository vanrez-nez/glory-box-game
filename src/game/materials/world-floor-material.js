import { IMAGE_ASSETS } from '@/game/assets';
import { StaticInstance as Skybox } from '@/game/skybox';
import GameMetaMaterial from '@/game/materials/meta-material';

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
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          wireframe: false,
        },
      },
      medium: {
        type: 'MeshPhongMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          color: 0x1c284d,
          reflectivity: 0.5,
          shininess: 5,
          specular: 0xf174d,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          color: 0x6082b6,
          envMap: Skybox.textureCube,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          normalMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundNormal, scale, scale),
          roughnessMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundRoughness, scale, scale),
          metalness: 0.69,
          roughness: 0.22,
          envMapIntensity: 0.18,
        },
      },
    });
  }
}
