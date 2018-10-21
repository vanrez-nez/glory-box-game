import { InputManager } from '@/common/input-manager';
import { KEYBOARD_CONTROLS, GAMEPAD_CONTROLS, EVENTS } from './const';

const GAMEPAD_INDEX = 0;

export default class GameInput {
  constructor() {
    this.actionsState = {
      Jump: false,
      Left: false,
      Right: false,
    };
    this.events = new EventEmitter3();
    this.inputManager = new InputManager({});
    this.onPauseDelegate = this.onPause.bind(this);
    this.bind();
  }

  bind() {
    const { onPauseDelegate, inputManager } = this;
    inputManager.opts.keyboardBindings = {
      Escape: onPauseDelegate,
    };
    inputManager.opts.gamepadBindings = {
      Select: onPauseDelegate,
      Back: onPauseDelegate,
    };
  }

  onPause() {
    this.events.emit(EVENTS.GamePause);
  }

  isPressed(state, keySet) {
    for (let i = 0; i < keySet.length; i++) {
      if (state[keySet[i]]) {
        return true;
      }
    }
    return false;
  }

  updateKeyboardState(propName, keySet) {
    const { actionsState: aState } = this;
    const { keyboard } = this.inputManager.state;
    aState[propName] = this.isPressed(keyboard, keySet);
  }

  updateGamepadState(propName, keySet) {
    const { actionsState: aState } = this;
    const { gamepad } = this.inputManager.state;
    const gp = gamepad[GAMEPAD_INDEX];
    if (gp && gp.connected) {
      const buttons = gp.buttons;
      aState[propName] = aState[propName] || this.isPressed(buttons, keySet);
    }
  }

  updateActionsState() {
    this.updateKeyboardState('Jump', KEYBOARD_CONTROLS.Jump);
    this.updateKeyboardState('Left', KEYBOARD_CONTROLS.Left);
    this.updateKeyboardState('Right', KEYBOARD_CONTROLS.Right);
    this.updateGamepadState('Jump', GAMEPAD_CONTROLS.Jump);
    this.updateGamepadState('Left', GAMEPAD_CONTROLS.Left);
    this.updateGamepadState('Right', GAMEPAD_CONTROLS.Right);
  }

  get state() {
    this.updateActionsState();
    return this.actionsState;
  }
}
