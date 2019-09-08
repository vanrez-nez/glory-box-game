import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/shining';

export default class PlayerHitFxMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: Shader.fragment,
          vertexShader: Shader.vertex,
          uniforms: Shader.uniforms,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        },
      },
    });
  }
}
