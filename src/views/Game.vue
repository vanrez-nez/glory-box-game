<template>
  <div class="Game">
    <game-stage ref="gameStage" @ready="onReady"></game-stage>
    <pause-menu
      v-if="paused"
      @restart="onRestart"
    ></pause-menu>
    <game-loader :visible="loading"></game-loader>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import GameStage from '@/components/game-stage.vue';
import PauseMenu from '@/components/pause-menu.vue';
import GameLoader from '@/components/game-loader.vue';

export default defineComponent({
  name: 'Game',
  components: {
    GameStage,
    PauseMenu,
    GameLoader,
  },
  data() {
    return {
      // Shown until the game emits 'ready'. Re-activating an already-built game
      // emits 'ready' synchronously inside recreate(), so the loader never
      // flashes on subsequent visits.
      loading: true,
    };
  },
  activated() {
    const gameStage = this.$refs.gameStage as any;
    this.loading = true;
    gameStage.recreate();
  },
  methods: {
    onReady() {
      this.loading = false;
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
