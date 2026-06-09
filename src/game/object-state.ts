import * as THREE from 'three';

const DEFAULT = {
  getStateFn: () => {},
  setStateFn: () => {},
};

export default class GameObjectState {
  opts!: Record<string, any>;
  id!: any;
  state!: Record<string, any>;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.id = THREE.MathUtils.generateUUID();
    this.state = {};
  }

  write(state: any) {
    const { opts } = this;
    this.state = state;
    opts.setStateFn(state);
    return this.state;
  }

  read() {
    const { opts } = this;
    this.state = opts.getStateFn();
    return this.state;
  }
}
