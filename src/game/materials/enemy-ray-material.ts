import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/enemy-ray';

export default class EnemyRayMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      // Each enemy ray gets its own node material (and its own TSL uniforms) so
      // instances animate independently — the old code cloned the GLSL uniforms.
      low: {
        create: () => Shader.create(),
      },
    });
  }
}
