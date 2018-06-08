import GameMetaMaterial from './meta-material';
import CylinderFxShader from '../../shaders/cylinder-fx';

export default class WorldFxCylinderMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: CylinderFxShader.fragmentShader,
          vertexShader: CylinderFxShader.vertexShader,
          uniforms: CylinderFxShader.uniforms,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        },
      },
    });
  }
}
