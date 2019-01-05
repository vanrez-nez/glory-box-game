import GameMetaMaterial from '@/game/materials/meta-material';

export default class EnemyVortexParticleMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'PointsMaterial',
        args: {
          size: opts.size,
          transparent: true,
          map: opts.map || null,
          color: opts.color,
          depthTest: true,
          blending: opts.blending || THREE.NormalBlending,
        },
      },
    });
  }
}
