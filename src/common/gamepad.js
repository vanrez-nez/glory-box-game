const noop = () => {};

const DEFAULT = {
  threshold: 0.1,
  autoupdate: true,
  onConnected: noop,
  onDisconnected: noop,
  onButtonChange: noop,
  onAxesChange: noop,
};

// XBOX 360 Layout
// Not tested on PS3 Controller
const BUTTONS_MAP = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'BACK',
  'SELECT',
  'LS_BUTTON',
  'RS_BUTTON',
  'DPAD_UP',
  'DPAD_DOWN',
  'DPAD_LEFT',
  'DPAD_RIGHT',
];

const AXIS_MAP = [
  'LEFT_X',
  'LEFT_Y',
  'RIGHT_X',
  'RIGHT_Y',
];

export default class Gamepad {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.rafId = null;
    this.prevButtonsState = {};
    this.prevAxesState = {};
    this.onConnectedDelegate = this.onGamepadConnected.bind(this);
    this.onDisconnectedDelegate = this.onGamepadDisconnected.bind(this);
    this.notifyAxesDelegate = this.notifyAxesChanges.bind(this);
    this.notifyButtonsDelegate = this.notifyButtonChanges.bind(this);
  }

  toggleBindings(enable) {
    const action = enable ? 'addEventListener' : 'removeEventListener';
    window[action]('gamepadconnected', this.onConnectedDelegate);
    window[action]('gamepaddisconnected', this.onDisconnectedDelegate);
  }

  onGamepadConnected(e) {
    const { opts } = this;
    this.startMonitor();
    opts.onConnected(e);
  }

  onGamepadDisconnected(e) {
    const { opts, controllers } = this;
    if (controllers.length === 0) {
      this.stopMonitor();
    }
    opts.onDisconnected(e);
  }

  bind() {
    this.toggleBindings(true);
    this.startMonitor();
  }

  unbind() {
    this.toggleBindings(false);
    this.stopMonitor();
  }

  updateState(controller) {
    const { prevAxesState, prevButtonsState } = this;
    const { notifyButtonsDelegate, notifyAxesDelegate } = this;
    const { buttons, axes, id } = controller;
    const aButtons = buttons.map(b => b.value);
    this.updateSetState(id, aButtons, prevButtonsState, notifyButtonsDelegate);
    this.updateSetState(id, axes, prevAxesState, notifyAxesDelegate);
  }

  updateSetState(id, currentState, prevState, onUpdate) {
    const { threshold } = this.opts;
    prevState[id] = prevState[id] || [];
    const diff = this.getStateDiff(currentState, prevState[id], threshold);
    for (let i = 0; i < diff.length; i++) {
      const dIndex = diff[i];
      const state = currentState[dIndex];
      onUpdate(dIndex, state > 0, state);
    }
  }

  /*
    Compares two numeric arrays and returns an array
    with each diff when greater that the given threshold
  */
  getStateDiff(current, prev, threshold) {
    const result = [];
    for (let i = 0; i < current.length; i++) {
      const state = current[i];
      if (state !== prev[i]) {
        if (prev[i] !== undefined) {
          const diff = Math.abs(state - prev[i]);
          if (diff > threshold) {
            result.push(i);
            prev[i] = state;
          }
        } else {
          // Initialize undefined slot
          prev[i] = state;
        }
      }
    }
    return result;
  }

  notifyButtonChanges(index, isDown, value) {
    const { opts } = this;
    const event = new CustomEvent('gamepadbutton', {
      detail: {
        name: BUTTONS_MAP[index],
        force: value,
        isDown,
      },
    });
    opts.onButtonChange(event);
  }

  notifyAxesChanges(index, _, value) {
    const { opts } = this;
    const event = new CustomEvent('gamepadaxes', {
      detail: {
        name: AXIS_MAP[index],
        force: value,
      },
    });
    opts.onAxesChange(event);
  }

  startMonitor() {
    const { controllers, rafId } = this;
    const { autoupdate } = this.opts;
    if (autoupdate && controllers.length > 0 && rafId === null) {
      this.onFrame();
    }
  }

  stopMonitor() {
    const { rafId } = this;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      this.rafId = null;
    }
  }

  onFrame() {
    this.rafId = window.requestAnimationFrame(this.onFrame.bind(this));
    this.update();
  }

  update() {
    const { controllers } = this;
    controllers.forEach(controller => this.updateState(controller));
  }

  get controllers() {
    const result = [];
    let gamepads = [];
    gamepads = navigator.getGamepads ?
      navigator.getGamepads() : gamepads;
    gamepads = navigator.webkitGetGamepads ?
      navigator.webkitGetGamepads() : gamepads;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] !== null) {
        result.push(gamepads[i]);
      }
    }
    return result;
  }
}
