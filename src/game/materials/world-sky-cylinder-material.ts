import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/nebula';

export default class WorldSkyCylinderMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
