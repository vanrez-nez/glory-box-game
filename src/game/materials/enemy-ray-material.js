import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/enemy-ray';

export default class EnemyRayMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: Shader.fragment,
          vertexShader: Shader.vertex,
          uniforms: THREE.UniformsUtils.clone(Shader.uniforms),
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        },
      },
    });
  }
}
