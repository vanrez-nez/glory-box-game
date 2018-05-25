import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

export default class EnemyEyesMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
          flatShading: true,
          vertexColors: THREE.VertexColors,
        },
      },
    });
  }
}
