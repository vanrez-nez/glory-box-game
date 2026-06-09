import { IMAGE_ASSETS } from '@/game/assets';
import GameMetaMaterial from '@/game/materials/meta-material';

export default class PlatformSocketMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          vertexColors: true,
          // wireframe: true,
        },
      },
      medium: {
        type: 'MeshLambertMaterial',
        args: {
          wireframe: false,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.HullBase, 0.1, 0.1),
          // vertexColors: true,
          // emissive: 0xffffff,
          // emissiveIntensity: 0.3,
        },
      },
    });
  }
}
