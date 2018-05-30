import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

export default class EnemyArmorMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
          flatShading: true,
          vertexColors: THREE.VertexColors,
        },
      },
      medium: {
        type: 'MeshStandardMaterial',
        args: {
          color: 0xffffff,
          flatShading: true,
          envMap: Skybox.textureCube,
          roughness: 0.5,
          metalness: 0.8,
          vertexColors: THREE.VertexColors,
        },
      },
    });
  }
}
