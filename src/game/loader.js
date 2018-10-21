
const DEFAULT = {
  map: null,
};

export default class GameLoader {
  constructor(opts) {
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
    return new Promise((resolve) => {
      this.loader = THREE.DefaultLoadingManager;
      this.loader.onProgress = (url, itemsLoaded, itemsTotal) => {
        if (itemsLoaded === itemsTotal) {
          resolve();
        }
      };
    });
  }
}
