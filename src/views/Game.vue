<template>
  <div class="Game">
    <game-stage ref="gameStage" @ready="onReady"></game-stage>
    <pause-menu
      v-if="paused"
      @restart="onRestart"
    ></pause-menu>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import GameStage from '@/components/game-stage.vue';
import PauseMenu from '@/components/pause-menu.vue';

export default defineComponent({
  name: 'Game',
  components: {
    GameStage,
    PauseMenu,
  },
  activated() {
    const gameStage = this.$refs.gameStage as any;
    gameStage.recreate();
  },
  methods: {
    onReady() {
      const gameStage = this.$refs.gameStage as any;
      gameStage.restart();
    },
    onRestart() {
      const gameStage = this.$refs.gameStage as any;
      gameStage.restart();
    },
  },
  computed: {
    ...mapState({
      paused: (state: any) => state.game.paused,
    }),
  },
});
</script>

<style src='@styles/views/game.css'></style>
