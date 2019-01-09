import { IMAGE_ASSETS } from '@/game/assets';
import GameMetaMaterial from '@/game/materials/meta-material';

export default class PlatformSocketMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          vertexColors: THREE.FaceColors,
          // wireframe: true,
        },
      },
      medium: {
        type: 'MeshLambertMaterial',
        args: {
          wireframe: false,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.HullBase, 0.1, 0.1),
          // vertexColors: THREE.FaceColors,
          // emissive: 0xffffff,
          // emissiveIntensity: 0.3,
        },
      },
    });
  }
}
