<template>
  <div class="Game">
    <game-stage ref="gameStage" @ready="onReady"></game-stage>
    <pause-menu
      v-if="paused"
      @restart="onRestart"
    ></pause-menu>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import GameStage from '@/components/game-stage';
import PauseMenu from '@/components/pause-menu';

export default {
  name: 'Game',
  components: {
    GameStage,
    PauseMenu,
  },
  activated() {
    const { quality } = this.$route.params;
    const { gameStage } = this.$refs;
    gameStage.recreate(quality);
  },
  methods: {
    onReady() {
      const { gameStage } = this.$refs;
      gameStage.restart();
    },
    onRestart() {
      const { gameStage } = this.$refs;
      gameStage.restart();
    },
  },
  computed: {
    ...mapState({
      paused: state => state.game.paused,
    }),
  },
};
</script>

<style lang="stylus" src='@styles/views/game.styl'></style>
