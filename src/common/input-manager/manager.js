import { invert } from 'lodash';
import {
  KEYBOARD,
  GAMEPAD_BUTTONS,
  GAMEPAD_AXES,
  GAMEPAD_EVENTS,
} from './input-const';
import KeyboardInput from './keyboard';
import GamepadInput from './gamepad';

const DEFAULT = {
  keyboardBindings: {},
  gamepadBindings: {},
};

const KeyboardInstance = new KeyboardInput();
const GamepadInstance = new GamepadInput();

// Invert controls constants for fast lookups
const KeyboardMap = invert(KEYBOARD);
const GamepadButtonsMap = invert(GAMEPAD_BUTTONS);

export default class InputManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.keyboardEventDelegate = this.handleKeyboardEvent.bind(this);
    this.gamepadEventDelegate = this.handleGamepadEvent.bind(this);
    this.gamepadButtonEventDelegate = this.handleGamepadButtonEvent.bind(this);
    this.gamepadAxeEventDelegate = this.handleGamepadAxeEvent.bind(this);
    this.bind();
  }

  bind() {
    this.toggleBindings('on');
  }

  unbind() {
    this.toggleBindings('off');
  }

  toggleBindings(action) {
    // KeyboardInstance.events.on('keyup', this.keyboardEventDelegate);
    KeyboardInstance.events[action]('keydown', this.keyboardEventDelegate);
    GamepadInstance.events[action]('gamepadbutton', this.gamepadButtonEventDelegate);
    GamepadInstance.events[action]('gamepadaxes', this.gamepadAxeEventDelegate);
    GamepadInstance.events[action]('gamepadconnected', this.gamepadEventDelegate);
    GamepadInstance.events[action]('gamepaddisconnected', this.gamepadEventDelegate);
  }

  handleKeyboardEvent(e) {
    const { keyboardBindings } = this.opts;
    const code = e.keyCode || e.which || e.charCode;
    const binding = keyboardBindings[KeyboardMap[code]];
    if (typeof binding === 'function') {
      binding(e);
    }
  }

  handleGamepadButtonEvent(e) {
    const { gamepadBindings } = this.opts;
    const { index } = e.detail;
    const binding = gamepadBindings[GamepadButtonsMap[index]];
    if (typeof binding === 'function') {
      if (e.detail.isDown) {
        binding(e);
      }
    }
  }

  handleGamepadAxeEvent(e) {
    const { gamepadBindings } = this.opts;
    const { name } = e.detail;
    const binding = gamepadBindings[name];
    if (GAMEPAD_AXES[name] && typeof binding === 'function') {
      binding(e);
    }
  }

  handleGamepadEvent(e) {
    const { gamepadBindings } = this.opts;
    const { type } = e;
    const binding = gamepadBindings[type];
    if (GAMEPAD_EVENTS[type] && typeof binding === 'function') {
      binding(e);
    }
  }

  get state() {
    return {
      keyboard: KeyboardInstance.state,
      gamepad: GamepadInstance.state,
    };
  }
}
