import GameMetaMaterial from './meta-material';
import EnemyRayShader from '../../shaders/enemy-ray-shader';

export default class EnemyRayMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: EnemyRayShader.fragmentShader,
          vertexShader: EnemyRayShader.vertexShader,
          uniforms: EnemyRayShader.uniforms,
          blending: THREE.AdditiveBlending,
          transparent: true,
        },
      },
    });
  }
}
