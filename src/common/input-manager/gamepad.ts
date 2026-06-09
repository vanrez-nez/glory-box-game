import EventEmitter3 from 'eventemitter3';

export default class GamepadInput {
  events!: EventEmitter3;
  rafId!: any;
  state!: Record<string, any>;
  onConnectedDelegate!: any;
  onDisconnectedDelegate!: any;
  constructor() {
    this.events = new EventEmitter3();
    this.rafId = null;
    this.state = {};
    this.onConnectedDelegate = this.onGamepadConnected.bind(this);
    this.onDisconnectedDelegate = this.onGamepadDisconnected.bind(this);
    this.bind();
  }

  bind() {
    window.addEventListener('gamepadconnected', this.onConnectedDelegate);
    window.addEventListener('gamepaddisconnected', this.onConnectedDelegate);
  }

  updateGamepadState(gamepad: any) {
    const { state } = this;
    const { index, connected } = gamepad;
    state[index] = state[index] || {
      buttons: [],
      axes: [],
    };
    state[index].connected = connected;
  }

  onGamepadConnected(e: any) {
    const { gamepad } = e;
    this.updateGamepadState(gamepad);
    this.startMonitor();
    this.events.emit('gamepadconnected', {
      gamepad,
      type: 'Connected',
    });
  }

  onGamepadDisconnected(e: any) {
    const { gamepad } = e;
    const { controllers } = this;
    this.updateGamepadState(gamepad);
    this.events.emit('gamepaddisconnected', {
      gamepad: e.gamepad,
      type: 'Disconnected',
    });
    if (controllers.length === 0) {
      this.stopMonitor();
    }
  }

  startMonitor() {
    const { controllers, rafId } = this;
    if (controllers.length > 0 && rafId === null) {
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

  /*
    Compares two numeric arrays and returns an array
    with each diff when greater that the given threshold
  */
  getStateDiff(current: any, prev: any, threshold: any) {
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

  updateState(controller: any) {
    this.updateButtonsState(controller);
    this.updateAxesState(controller);
  }

  updateButtonsState(controller: any) {
    const { state } = this;
    const { buttons, index } = controller;
    const { buttons: prevState } = state[index];
    const aButtons = buttons.map((b: any) => b.value);
    const diff = this.getStateDiff(aButtons, prevState, 0.1);
    for (let i = 0; i < diff.length; i++) {
      const btnIndex = diff[i];
      this.notifyButtonChanges(controller, btnIndex);
    }
    state[index].buttons = aButtons;
  }

  updateAxesState(controller: any) {
    const { state } = this;
    const { axes, index } = controller;
    const { axes: prevState } = state[index];
    const diff = this.getStateDiff(axes, prevState, 0.1);
    for (let i = 0; i < diff.length; i++) {
      const axeIndex = diff[i];
      this.notifyAxesChanges(controller, axeIndex);
    }
    state[index].axes = [].concat(axes);
  }

  notifyButtonChanges(controller: any, index: any) {
    const { buttons } = controller;
    const force = buttons[index].value;
    this.events.emit('gamepadbutton', {
      detail: {
        index,
        force,
        controller,
        isDown: force > 0,
      },
    });
  }

  notifyAxesChanges(controller: any, index: any) {
    const { axes } = controller;
    const force = axes[index];
    this.events.emit('gamepadaxes', {
      detail: {
        index,
        force,
        controller,
      },
    });
  }

  update() {
    const { controllers } = this;
    for (let i = 0; i < controllers.length; i++) {
      this.updateState(controllers[i]);
    }
  }

  get controllers() {
    const result = [];
    let gamepads: any[] = [];
    gamepads = navigator.getGamepads ?
      navigator.getGamepads() : gamepads;
    gamepads = (navigator as any).webkitGetGamepads ?
      (navigator as any).webkitGetGamepads() : gamepads;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] !== null) {
        result.push(gamepads[i]);
      }
    }
    return result;
  }
}
