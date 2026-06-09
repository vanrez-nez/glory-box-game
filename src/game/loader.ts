import * as THREE from 'three';

const DEFAULT = {
  map: null,
};

export default class GameLoader {
  opts!: Record<string, any>;
  loader!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
  }

  async load() {
    await Promise.all([
      this.loadMap(),
      this.loadAssets(),
    ]);
  }

  async loadMap() {
    const { map } = this.opts;
    await map.load();
  }

  async loadAssets() {
    return new Promise<void>((resolve) => {
      this.loader = THREE.DefaultLoadingManager;
      this.loader.onProgress = (url: any, itemsLoaded: any, itemsTotal: any) => {
        if (itemsLoaded === itemsTotal) {
          resolve();
        }
      };
    });
  }
}
