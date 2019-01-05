import GameMetaMaterial from '@/game/materials/meta-material';
import ShineFxShader from '@/shaders/shine-fx';

export default class PlayerHitFxMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          fragmentShader: ShineFxShader.fragmentShader,
          vertexShader: ShineFxShader.vertexShader,
          uniforms: ShineFxShader.uniforms,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        },
      },
    });
  }
}
