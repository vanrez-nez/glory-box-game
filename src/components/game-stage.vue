<template>
  <div class="GameStage">
    <img
      class="hidden"
      ref="map"
      :src="mapBugUrl"
    />
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { isObject, isEmpty } from 'lodash';
import { EVENTS } from '@/game/const';
import Game from '@/game/main';
import mapBugUrl from '@/assets/images/jumper_map_bug.png';

export default defineComponent({
  name: 'GameStage',
  data() {
    return {
      prevQuality: '',
      mapBugUrl,
      game: null as Game | null,
    };
  },
  methods: {
    recreate(quality: any) {
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      const map = this.$refs.map as HTMLImageElement;
      if (this.prevQuality !== quality) {
        this.prevQuality = quality;
        this.destroy();
      }
      if (isEmpty(this.game)) {
        const game = new Game({
          canvasElement: canvas,
          mapElement: map,
          store: this.$store,
          quality,
        });
        this.game = game;
        game.events.on(EVENTS.GameReady, () => {
          this.$emit('ready');
        });
      } else {
        this.$emit('ready');
      }
    },
    destroy() {
      if (isObject(this.game)) {
        this.game!.dispose();
        this.game = null;
      }
    },
    restart() {
      const game = this.game!;
      game.restart();
      game.resume();
    },
  },
});
</script>
