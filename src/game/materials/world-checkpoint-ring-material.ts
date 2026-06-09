import GameMetaMaterial from '@/game/materials/meta-material';
import CheckpointRingFxShader from '@/shaders/checkpoint-ring';

export default class WorldCheckpointRingMaterial extends GameMetaMaterial {
  constructor(opts: any) {
    super({
      nodeName: opts.name,
      low: {
        create: () => CheckpointRingFxShader.create(),
      },
    });
  }
}
