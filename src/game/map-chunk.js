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
    this.defaultPositions = {};
    this.defaultStates = {};
    this.states = {};
    this.offsetY = 0;
  }

  unload() {
    if (!this.isRoot && this.loaded === true) {
      this.loaded = false;
      this.saveObjectsStates();
      this.events.emit(EVENTS.MapChunkUnloaded, this);
    }
  }

  load() {
    if (!this.isRoot && this.loaded === false) {
      this.onBeforeLoad(this);
      this.translateObjects();
      this.loadObjectsStates();
      this.loaded = true;
      this.events.emit(EVENTS.MapChunkLoaded, this);
    }
  }

  getObjects() {
    const { platforms, collectibles } = this.opts;
    return [].concat(platforms, collectibles);
  }

  saveDefaults() {
    const { defaultPositions, defaultStates } = this;
    this.getObjects().forEach((o) => {
      defaultPositions[o.body.id] = o.body.position.clone();
      if (o.state) {
        defaultStates[o.state.id] = o.state.read();
      }
    });
  }

  loadDefaults() {
    const { states, defaultStates } = this;
    this.getObjects().forEach((o) => {
      if (o.state) {
        o.state.write(defaultStates[o.state.id]);
        states[o.state.id] = o.state.read();
      }
    });
  }

  loadObjectsStates() {
    const { states, defaultStates } = this;
    this.getObjects().forEach((o) => {
      if (o.state) {
        const { id } = o.state;
        const state = states[id] || defaultStates[id];
        o.state.write(state);
      }
    });
  }

  saveObjectsStates() {
    this.getObjects().forEach((o) => {
      if (o.state) {
        this.states[o.state.id] = o.state.read();
      }
    });
  }

  translateObjects() {
    const { defaultPositions, offsetY } = this;
    const { sockets } = this.opts;
    const vec2 = new THREE.Vector2();
    this.getObjects().forEach((obj) => {
      vec2.copy(defaultPositions[obj.body.id]);
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
      chunk.defaultPositions = this.defaultPositions;
      chunk.defaultStates = this.defaultStates;
      chunk.onBeforeLoad = this.unloadInstances.bind(this);
      this.instances.push(chunk);
    }
    return chunk;
  }
}
