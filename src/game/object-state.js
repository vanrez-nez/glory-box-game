const DEFAULT = {
  getStateFn: () => {},
  setStateFn: () => {},
};

export default class GameObjectState {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.id = THREE.Math.generateUUID();
    this.state = {};
  }

  write(state) {
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
