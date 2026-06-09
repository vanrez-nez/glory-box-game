import * as THREE from 'three';
import GameMetaMaterial from '@/game/materials/meta-material';
import CheckpointRingFxShader from '@/shaders/checkpoint-ring';

export default class WorldCheckpointRingMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        type: 'ShaderMaterial',
        args: {
          side: THREE.FrontSide,
          fragmentShader: CheckpointRingFxShader.fragment,
          vertexShader: CheckpointRingFxShader.vertex,
          uniforms: CheckpointRingFxShader.uniforms,
        },
      },
    });
  }
}
