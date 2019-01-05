import GameMetaMaterial from '@/game/materials/meta-material';

export default class EnemyEyesMaterial extends GameMetaMaterial {
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
    });
  }
}
