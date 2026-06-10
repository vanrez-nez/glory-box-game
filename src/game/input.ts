import EventEmitter3 from 'eventemitter3';
import { InputManager, KEYBOARD } from '@/common/input-manager';
import { KEYBOARD_CONTROLS, GAMEPAD_CONTROLS, EVENTS } from '@/game/const';

const GAMEPAD_INDEX = 0;

export default class GameInput {
  actionsState!: Record<string, any>;
  events!: EventEmitter3;
  inputManager!: any;
  onPauseDelegate!: any;
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

  isPressed(state: any, keySet: any) {
    for (let i = 0; i < keySet.length; i++) {
      if (state[keySet[i]]) {
        return true;
      }
    }
    return false;
  }

  updateKeyboardState(propName: any, keySet: any) {
    const { actionsState: aState } = this;
    const { keyboard } = this.inputManager.state;
    aState[propName] = this.isPressed(keyboard, keySet);
  }

  updateGamepadState(propName: any, keySet: any) {
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

  // Raw arrow-key axes for edit-mode flying: x = around the cylinder (sides),
  // y = elevation (up/down). Read straight from the keyboard so it's independent
  // of the gameplay Jump/Left/Right actions.
  get editAxes() {
    const { keyboard } = this.inputManager.state;
    return {
      x: (keyboard[KEYBOARD.ArrowRight] ? 1 : 0) - (keyboard[KEYBOARD.ArrowLeft] ? 1 : 0),
      y: (keyboard[KEYBOARD.ArrowUp] ? 1 : 0) - (keyboard[KEYBOARD.ArrowDown] ? 1 : 0),
    };
  }
}
