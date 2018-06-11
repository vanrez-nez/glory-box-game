import GameMetaMaterial from './meta-material';

export default class GenericColorMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          transparent: opts.transparent || false,
          opacity: opts.opacity || 1,
          color: opts.color,
          depthWrite: opts.depthWrite || true,
          blending: opts.blending || THREE.NormalBlending,
        },
      },
    });
  }
}
