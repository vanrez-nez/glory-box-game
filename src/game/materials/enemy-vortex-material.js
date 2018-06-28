import GameMetaMaterial from './meta-material';
import EnemyVortexShader from '../../shaders/enemy-vortex-shader';

export default class EnemyVortexMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: EnemyVortexShader.fragmentShader,
          vertexShader: EnemyVortexShader.vertexShader,
          uniforms: EnemyVortexShader.uniforms,
          transparent: true,
          depthWrite: false,
          wireframe: false,
        },
      },
    });
  }
}
