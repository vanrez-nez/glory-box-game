import { StaticInstance as Skybox } from '@/game/skybox';
import GameMetaMaterial from '@/game/materials/meta-material';
import { IMAGE_ASSETS } from '@/game/assets';

export default class CollectibleSocketMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
        },
      },
      medium: {
        type: 'MeshLambertMaterial',
        args: {
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GroundBase, 1, 1),
          envMap: Skybox.textureCube,
          reflectivity: 0.35,
          color: opts.color,
        },
      },
    });
  }
}
