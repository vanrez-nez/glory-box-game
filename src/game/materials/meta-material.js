import { QUALITY } from '../const';

const DEFAULTS = {
  nodeName: '',
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
      case QUALITY.Low:
        this.createLowQualityMaterial();
        mat = this.low;
        break;
      case QUALITY.Medium:
        this.createMediumQualityMaterial();
        mat = this.medium || this.getMaterial(QUALITY.Low);
        break;
      case QUALITY.High:
        this.createHighQualityMaterial();
        mat = this.high || this.getMaterial(QUALITY.Medium);
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

  solvePropDefers(args) {
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
      /*
        Some props come in the form of functions,
        that means the property is being lazy loaded.
        All materials use this form to handle texture loading
        by using the utility function GetTextureRepeatDefer
      */
      this.solvePropDefers(profile.args);
      if (THREE[mType]) {
        mat = new THREE[mType](profile.args);
      } else if (window[mType]) {
        /*
          Some materials are from external libraries such as
          the MeshLineMaterial, in that case we search for
          a global declaration
        */
        mat = new window[mType](profile.args);
      }
      mat.userData = {
        nodeId: this.opts.nodeName,
      };
    }
    return mat;
  }

  get activeMaterial() {
    return this.low || this.medium || this.high;
  }
}
