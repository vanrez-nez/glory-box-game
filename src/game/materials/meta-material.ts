import * as THREE from 'three/webgpu';
import { GetTextureRepeat } from '@/game/utils';


const DEFAULTS = {
  nodeName: '',
  profile: {
    type: 'MeshBasicMaterial',
    args: {},
  },
};

const CACHED_TEXTURES: Record<string, any> = {};

export default class GameMetaMaterial {
  opts: Record<string, any>;
  material: THREE.Material | null = null;
  // Registry key this material was built from (e.g. 'WorldCylinder', 'EnemyRay').
  // Set by the factory; used by the dev tools and mood manager to group/branch
  // instances by kind now that they share one class.
  materialType = '';

  constructor(opts: any) {
    this.opts = { ...DEFAULTS, ...opts };
    this.material = null;
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

  getMaterial(): THREE.Material | null {
    if (this.material === null) {
      this.material = this.createMaterial(this.opts.profile);
    }
    return this.material;
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
    this.material && this.material.dispose();
    this.material = null;
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
    return this.getMaterial();
  }
}
