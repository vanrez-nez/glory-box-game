<template>
  <div class="GameInput"></div>
</template>

<script>
import { InputManager } from '@/common/input-manager';

export default {
  name: 'GameInput',
  data() {
    return {
      inputManager: null,
    };
  },
  props: {
    keyboardBindings: {
      type: Object,
      default: () => ({}),
    },
    gamepadBindings: {
      type: Object,
      default: () => ({}),
    },
  },
  created() {
    this.inputManager = new InputManager({
      keyboardBindings: this.keyboardBindings,
      gamepadBindings: this.gamepadBindings,
    });
  },
  destroyed() {
    this.inputManager.unbind();
  },
  // methods: {
  //   handleInput(e) {
  //     const { detail, type } = e;
  //     const name = detail.name.toLowerCase();
  //     if (type === 'gamepadaxes') {
  //       // Only process defined movements from the axes
  //       if (Math.abs(detail.force) > 0.8) {
  //         this.handleAxesChange(name, detail);
  //       }
  //     } else if (type === 'gamepadbutton') {
  //       this.handleButtonChange(name, detail);
  //     }
  //   },
  //   handleButtonChange(buttonName, detail) {
  //     const { gamepadBindings } = this;
  //     const binding = gamepadBindings[buttonName];
  //     if (detail.isDown && typeof binding === 'function') {
  //       binding();
  //     }
  //   },
  //   handleAxesChange(buttonName, detail) {
  //     const { gamepadBindings } = this;
  //     const { force } = detail;

  //     // Translate axe binding name
  //     let bindingName = '';
  //     if (buttonName === 'left_x') {
  //       bindingName = force < 0 ? 'laxe_left' : 'laxe_right';
  //     } else if (buttonName === 'left_y') {
  //       bindingName = force < 0 ? 'laxe_up' : 'laxe_down';
  //     }
  //     const binding = gamepadBindings[bindingName];
  //     if (typeof binding === 'function') {
  //       binding();
  //     }
  //   },
  watch: {
    keyboardBindings: {
      immediate: true,
      handler: (value) => {
        if (this.inputManager) {
          const { opts } = this.inputManager;
          opts.keyboardBindings = value;
        }
      },
    },
    gamepadBindings: {
      immediate: true,
      handler: (value) => {
        if (this.inputManager) {
          const { opts } = this.inputManager;
          opts.gamepadBindings = value;
        }
      },
    },
  },
};
</script>
