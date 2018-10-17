<template>
  <div class="Game">
    <game-stage ref="gameStage" @stagePause="onStagePause"></game-stage>
    <pause-menu
      v-if="menuVisible"
      @menuExit="onMenuExit"
      @resume="onResume"
      @restart="onRestart"
    ></pause-menu>
  </div>
</template>

<script>
import GameStage from '@/components/GameStage';
import PauseMenu from '@/components/PauseMenu';

export default {
  name: 'Game',
  data() {
    return {
      menuVisible: false,
    };
  },
  components: {
    GameStage,
    PauseMenu,
  },
  activated() {
    this.onRestart();
  },
  methods: {
    toggleMenu() {
      const { menuVisible } = this;
      if (menuVisible) {
        this.onResume();
      } else {
        this.onPause();
      }
    },
    onStagePause() {
      this.menuVisible = true;
    },
    onResume() {
      const { gameStage } = this.$refs;
      this.menuVisible = false;
      this.$nextTick(() => {
        gameStage.$emit('resume');
      });
    },
    onPause() {
      const { gameStage } = this.$refs;
      this.menuVisible = true;
      gameStage.$emit('pause');
    },
    onRestart() {
      const { gameStage } = this.$refs;
      this.menuVisible = false;
      gameStage.$emit('restart');
    },
    onMenuExit() {
      this.toggleMenu();
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

<style lang="stylus" src='@styles/views/Game.styl'></style>
