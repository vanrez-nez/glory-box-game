import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/vortex';

export default class EnemyVortexMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: Shader.fragment,
          vertexShader: Shader.vertex,
          uniforms: Shader.uniforms,
          transparent: true,
          depthWrite: false,
          wireframe: false,
        },
      },
    });
  }
}
