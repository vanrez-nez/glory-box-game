import GameMetaMaterial from './meta-material';
import NebulaShader from '../../shaders/nebula';

export default class WorldSkyCylinderMaterial extends GameMetaMaterial {
  constructor() {
    super({
      low: {
        type: 'ShaderMaterial',
        args: {
          side: THREE.BackSide,
          fragmentShader: NebulaShader.fragmentShader,
          vertexShader: NebulaShader.vertexShader,
          uniforms: NebulaShader.uniforms,
        },
      },
    });
  }
}
