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
      this.loaded = true;
      this.translateObjects();
      this.events.emit(EVENTS.MapChunkLoaded, this);
    }
  }

  saveStartPositions() {
    const { positions } = this;
    const { platforms, collectibles } = this.opts;
    platforms.forEach((p) => {
      positions[p.body.id] = p.body.position.clone();
    });
    collectibles.forEach((c) => {
      positions[c.body.id] = c.body.position.clone();
    });
  }

  translateObjects() {
    const { positions, offsetY } = this;
    const { platforms, sockets } = this.opts;
    for (let i = 0; i < platforms.length; i++) {
      const { body } = platforms[i];
      const initialPosition = positions[body.id];
      body.position.y = initialPosition.y + offsetY;
    }
    for (let i = 0; i < sockets.length; i++) {
      const socket = sockets[i];
      socket.position.y = offsetY;
    }
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
