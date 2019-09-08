import GameMetaMaterial from '@/game/materials/meta-material';
import Shader from '@/shaders/nebula';

export default class WorldSkyCylinderMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          side: THREE.BackSide,
          fragmentShader: Shader.fragment,
          vertexShader: Shader.vertex,
          uniforms: Shader.uniforms,
        },
      },
    });
  }
}
