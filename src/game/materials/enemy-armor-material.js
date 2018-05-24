import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

export default class EnemyArmorMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: 0x131e,
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