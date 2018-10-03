import { KEYBOARD_BINDINGS as KB } from './const';

export default class GameInput {
  constructor() {
    this.events = new EventEmitter3();
    this.initState();
    this.setupKeyboard();
  }

  initState() {
    this.state = Object.keys(KB).reduce(
      (o, k) => ({ ...o, [k]: false }), {});
  }

  setState(action, isDown) {
    this.state[action] = isDown;
    this.events.emit(KB[action], isDown);
  }

  getKeyActionByCode(code) {
    return Object.keys(KB).find(
      k => KB[k].indexOf(code) > -1);
  }

  handleKeyEvent(event) {
    const code = event.keyCode || event.which || event.charCode;
    const action = this.getKeyActionByCode(code);
    if (action) {
      const isDown = event.type === 'keydown';
      this.setState(action, isDown);
    }
  }

  setupKeyboard() {
    Object.keys(KB).forEach(() => {
      document.addEventListener('keydown', this.handleKeyEvent.bind(this), false);
      document.addEventListener('keyup', this.handleKeyEvent.bind(this), false);
    });
  }
}
