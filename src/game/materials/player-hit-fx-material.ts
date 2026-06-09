import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/shining';

export default class PlayerHitFxMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
