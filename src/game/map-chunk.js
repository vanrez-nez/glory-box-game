import { EVENTS } from './const';

const DEFAULT = {
  index: -1,
  platforms: [],
  collectibles: [],
  sockets: [],
};

export default class GameMapChunk {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.loaded = false;
    this.isRoot = false;
    this.instances = [];
    this.positions = {};
    this.offsetY = 0;
  }

  unload() {
    if (!this.isRoot && this.loaded === true) {
      this.loaded = false;
      this.events.emit(EVENTS.MapChunkUnloaded, this);
    }
  }

  load() {
    if (!this.isRoot && this.loaded === false) {
      this.onBeforeLoad(this);
      this.translateObjects();
      this.loaded = true;
      this.events.emit(EVENTS.MapChunkLoaded, this);
    }
  }

  getPhysicsObjects() {
    const { platforms, collectibles } = this.opts;
    return [].concat(platforms, collectibles);
  }

  saveStartPositions() {
    const { positions } = this;
    const { platforms, collectibles } = this.opts;
    this.getPhysicsObjects().forEach((o) => {
      positions[o.body.id] = o.body.position.clone();
    });
  }

  translateObjects() {
    const { positions, offsetY } = this;
    const { platforms, collectibles, sockets } = this.opts;
    const vec2 = new THREE.Vector2();
    this.getPhysicsObjects().forEach((obj) => {
      vec2.copy(positions[obj.body.id]);
      vec2.y += offsetY;
      obj.setPosition(vec2);
    });
    sockets.forEach((s) => {
      s.position.y = offsetY;
    });
  }

  unloadInstances() {
    const { instances } = this;
    for (let i = 0; i < instances.length; i++) {
      const instance = this.instances[i];
      instance.unload();
    }
  }

  getInstance(offsetY) {
    let chunk;
    if (this.isRoot) {
      chunk = new GameMapChunk(this.opts);
      chunk.loaded = false;
      chunk.offsetY = offsetY;
      chunk.positions = this.positions;
      chunk.onBeforeLoad = this.unloadInstances.bind(this);
      this.instances.push(chunk);
    }
    return chunk;
  }
}
