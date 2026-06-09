import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/pickup-burst';

export default class WorldFxCylinderMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
