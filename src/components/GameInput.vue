<template>
  <div class="GameInput" v-hotkey="keyboardBindings"></div>
</template>

<script>
import Gamepad from '@/common/gamepad';

export default {
  name: 'GameInput',
  data() {
    return {
      gamepad: null,
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
    this.gamepad = new Gamepad({
      threshold: 0.2,
      onConnected: this.onGamepadConnected,
      onDisconnected: this.onGamepadDisconnected,
      onButtonChange: this.handleInput,
      onAxesChange: this.handleInput,
    });
  },
  mounted() {
    this.gamepad.bind();
  },
  destroyed() {
    this.gamepad.unbind();
  },
  activated() {
    this.gamepad.bind();
  },
  deactivated() {
    this.gamepad.unbind();
  },
  methods: {
    handleInput(e) {
      const { detail, type } = e;
      const name = detail.name.toLowerCase();
      if (type === 'gamepadaxes') {
        // Only process defined movements from the axes
        if (Math.abs(detail.force) > 0.8) {
          this.handleAxesChange(name, detail);
        }
      } else if (type === 'gamepadbutton') {
        this.handleButtonChange(name, detail);
      }
    },
    handleButtonChange(buttonName, detail) {
      const { gamepadBindings } = this;
      const binding = gamepadBindings[buttonName];
      if (detail.isDown && typeof binding === 'function') {
        binding();
      }
    },
    handleAxesChange(buttonName, detail) {
      const { gamepadBindings } = this;
      const { force } = detail;

      // Translate axe binding name
      let bindingName = '';
      if (buttonName === 'left_x') {
        bindingName = force < 0 ? 'laxe_left' : 'laxe_right';
      } else if (buttonName === 'left_y') {
        bindingName = force < 0 ? 'laxe_up' : 'laxe_down';
      }
      const binding = gamepadBindings[bindingName];
      if (typeof binding === 'function') {
        binding();
      }
    },
    onGamepadConnected() {
      this.$emit('gamepadConnected');
    },
    onGamepadDisconnected() {
      this.$emit('gamepadDisconnected');
    },
  },
};
</script>
