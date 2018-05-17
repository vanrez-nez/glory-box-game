import GameMetaMaterial from './meta-material';

export default class PlayerMaterial extends GameMetaMaterial {
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
