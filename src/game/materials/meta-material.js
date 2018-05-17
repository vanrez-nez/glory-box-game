import { MATERIAL } from '../const';

const DEFAULTS = {
  low: {
    type: 'MeshBasicMaterial',
    args: {},
  },
  medium: {},
  high: {},
};

export default class GameMetaMaterial {
  constructor(opts) {
    this.opts = { ...DEFAULTS, ...opts };
    this.high = null;
    this.medium = null;
    this.low = null;
  }

  getMaterial(quality) {
    let mat = null;
    switch (quality) {
      case MATERIAL.QualityLow:
        this.createLowQualityMaterial();
        mat = this.low;
        break;
      case MATERIAL.QualityMedium:
        this.createMediumQualityMaterial();
        mat = this.medium || this.getMaterial(MATERIAL.QualityLow);
        break;
      case MATERIAL.QualityHigh:
        this.createHighQualityMaterial();
        mat = this.high || this.getMaterial(MATERIAL.QualityMedium);
        break;
    }
    return mat;
  }

  createLowQualityMaterial() {
    if (this.low === null) {
      this.low = this.createMaterial(this.opts.low);
    }
  }

  createMediumQualityMaterial() {
    if (this.medium === null) {
      this.medium = this.createMaterial(this.opts.medium);
    }
  }

  createHighQualityMaterial() {
    if (this.high === null) {
      this.high = this.createMaterial(this.opts.high);
    }
  }

  solveArgumentDefers(args) {
    const keys = Object.keys(args);
    keys.forEach((k) => {
      if (typeof args[k] === 'function') {
        args[k] = args[k]();
      }
    });
  }

  createMaterial(profile) {
    let mat = null;
    if (profile.type) {
      const mType = profile.type;
      this.solveArgumentDefers(profile.args);
      mat = new THREE[mType](profile.args);
    }
    return mat;
  }
}
