import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/fireball';

export default class PlayerHudFireballMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: Shader.fragment,
          vertexShader: Shader.vertex,
          uniforms: Shader.uniforms,
        },
      },
    });
  }
}
