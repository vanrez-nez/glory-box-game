import GameMetaMaterial from './meta-material';

export default class GenericColorMaterial extends GameMetaMaterial {
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
