export default class KeyboardInput {
  constructor() {
    this.events = new EventEmitter3();
    this.state = {};
    this.bind();
  }

  bind() {
    document.addEventListener('keydown', this.handleKeyEvent.bind(this), false);
    document.addEventListener('keyup', this.handleKeyEvent.bind(this), false);
  }

  handleKeyEvent(e) {
    const { state, events } = this;
    const { type, keyCode } = e;
    const prev = state[keyCode];
    state[keyCode] = type === 'keydown';
    if (prev !== state[keyCode]) {
      events.emit(type, e);
    }
  }
}
