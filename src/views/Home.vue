<template>
  <div class="Home" v-hotkey="keymap">
    <keep-alive>
      <game ref="game" :paused='menuVisible'></game>
    </keep-alive>
    <pause-menu
      v-if="menuVisible"
      @resume="menuVisible = false"
      @restart="onRestart"
    ></pause-menu>
  </div>
</template>

<script>
import Game from '@/components/Game';
import PauseMenu from '@/components/PauseMenu';

export default {
  name: 'Home',
  data() {
    return {
      menuVisible: false,
    };
  },
  components: {
    Game,
    PauseMenu,
  },
  methods: {
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
    },
    onRestart() {
      const { game } = this.$refs;
      game.$emit('restart');
    },
  },
  computed: {
    keymap() {
      return {
        esc: this.toggleMenu,
      };
    },
  },
};
</script>

<style lang="stylus">
  src='@styles/views/Home.styl';
</style>
