import GameMetaMaterial from './meta-material';

export default class GenericTrailMaterial extends GameMetaMaterial {
  constructor(opts) {
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshLineMaterial',
        args: {
          color: new THREE.Color(opts.color),
          opacity: opts.opacity || 1,
          transparent: opts.transparent || false,
          side: THREE.DoubleSide,
          sizeAttenuation: true,
          lineWidth: opts.lineWidth,
        },
      },
    });
  }
}
