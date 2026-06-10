import * as THREE from 'three/webgpu';
import { GetTextureRepeat } from '@/game/utils';
import { QUALITY } from '@/game/const';


const DEFAULTS = {
  nodeName: '',
  low: {
    type: 'MeshBasicMaterial',
    args: {},
  },
  medium: {},
  high: {},
};

const CACHED_TEXTURES: Record<string, any> = {};

export default class GameMetaMaterial {
  opts: Record<string, any>;
  high: THREE.Material | null = null;
  medium: THREE.Material | null = null;
  low: THREE.Material | null = null;
  // Registry key this material was built from (e.g. 'WorldCylinder', 'EnemyRay').
  // Set by the factory; used by the dev tools and mood manager to group/branch
  // instances by kind now that they share one class.
  materialType = '';

  constructor(opts: any) {
    this.opts = { ...DEFAULTS, ...opts };
    this.high = null;
    this.medium = null;
    this.low = null;
  }

  static GetTexture(...args: any[]) {
    const id = `${[...args]}`;
    return () => {
      if (!CACHED_TEXTURES[id]) {
        CACHED_TEXTURES[id] = (GetTextureRepeat as any)(...args);
      }
      return CACHED_TEXTURES[id];
    };
  }

  getMaterial(quality: any): THREE.Material | null {
    let mat: THREE.Material | null = null;
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

  solvePropDefers(args: any) {
    const keys = Object.keys(args);
    keys.forEach((k) => {
      if (typeof args[k] === 'function') {
        args[k] = args[k]();
      }
    });
  }

  dispose() {
    this.high && this.high.dispose();
    this.medium && this.medium.dispose();
    this.low && this.low.dispose();
    this.high = null;
    this.medium = null;
    this.low = null;
  }

  createMaterial(profile: any): THREE.Material | null {
    let mat: THREE.Material | null = null;
    /*
      TSL node materials can't be built from a class-name string the way the
      built-in materials are, so a profile may instead provide a `create`
      factory that returns a ready node material (with its TSL `uniforms` dict
      attached for runtime updates). Used by the custom-shader materials.
    */
    if (typeof profile.create === 'function') {
      mat = profile.create();
      if (mat) {
        mat.userData = { nodeId: this.opts.nodeName };
      }
      return mat;
    }
    if (profile.type) {
      const mType = profile.type;
      /*
        Some props come in the form of functions,
        that means the property is being lazy loaded.
        All materials use this form to handle texture loading
        by using the utility function GetTextureRepeatDefer
      */
      this.solvePropDefers(profile.args);
      const Ctor = (THREE as any)[mType];
      if (Ctor) {
        mat = new Ctor(profile.args);
      }
      if (mat) {
        mat.userData = {
          nodeId: this.opts.nodeName,
        };
      }
    }
    return mat;
  }

  get activeMaterial() {
    return this.low || this.medium || this.high;
  }
}
