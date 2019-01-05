import GameMetaMaterial from '@/game/materials/meta-material';
import FireballShader from '@/shaders/fireball';

export default class PlayerHudFireballMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: FireballShader.fragmentShader,
          vertexShader: FireballShader.vertexShader,
          uniforms: FireballShader.uniforms,
        },
      },
    });
  }
}
