import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/fireball';

export default class PlayerHudFireballMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
