import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/vortex';

export default class EnemyVortexMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
