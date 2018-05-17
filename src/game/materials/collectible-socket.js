import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

export default class CollectibleSocketMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
        },
      },
      medium: {
        type: 'MeshLambertMaterial',
        envMap: Skybox.textureCube,
        reflectivity: 0.35,
        color: opts.color,
      },
    });
  }
}
