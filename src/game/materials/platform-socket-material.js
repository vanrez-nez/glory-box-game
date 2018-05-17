import GameMetaMaterial from './meta-material';

export default class PlatformSocketMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: opts.color,
        },
      },
    });
  }
}
