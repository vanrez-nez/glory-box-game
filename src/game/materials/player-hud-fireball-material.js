import GameMetaMaterial from './meta-material';
import FireballShader from '../../shaders/fireball';

export default class PlayerHudFireballMaterial extends GameMetaMaterial {
  constructor() {
    super({
      low: {
        type: 'ShaderMaterial',
        args: {
          side: THREE.BackSide,
          fragmentShader: FireballShader.fragmentShader,
          vertexShader: FireballShader.vertexShader,
          uniforms: FireballShader.uniforms,
        },
      },
    });
  }
}
