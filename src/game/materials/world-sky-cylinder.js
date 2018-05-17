import GameMetaMaterial from './meta-material';
import NebulaShader from '../../shaders/nebula';

export default class WorldSkyCylinder extends GameMetaMaterial {
  constructor(opts) {
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
