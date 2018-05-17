import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

export default class CollectibleTrailMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      low: {
        type: 'MeshLineMaterial',
        args: {
          color: mew THREE.Color(opts.color),
          side: THREE.DoubleSide,
          sizeAttenuation: true,
          lineWidth: 0.3,
        },
      },
    });
  }
}
