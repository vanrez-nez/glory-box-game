<template>
  <div class="GamepadMonitor">
    <game-input :gamepadBindings="gamepadBindings"></game-input>
  </div>
</template>

<script>
import { GAMEPAD } from '@/store/modules/game';
import { SHOW_ALERT } from '@/store/modules/alert';
import GameInput from '@/components/game-input';

export default {
  name: 'GamepadMonitor',
  components: {
    GameInput,
  },
  methods: {
    onGamepadConnected(e) {
      const { $store } = this;
      const { gamepad } = e;
      $store.commit(GAMEPAD, true);
      $store.commit(SHOW_ALERT, {
        icon: 'icon-gamepad',
        title: 'GAMEPAD CONNECTED',
        text: gamepad.id,
        time: 3.5,
      });
    },
    onGamepadDisconnected() {
      const { $store } = this;
      $store.commit(GAMEPAD, false);
    },
  },
  computed: {
    gamepadBindings() {
      return {
        Connected: this.onGamepadConnected,
        Disconnected: this.onGamepadDisconnected,
      };
    },
  },
};
</script>
