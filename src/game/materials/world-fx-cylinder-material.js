import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/pickup-burst';

export default class WorldFxCylinderMaterial extends GameMetaMaterial {
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
