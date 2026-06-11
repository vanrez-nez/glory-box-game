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
      mapBugUrl,
      game: null as Game | null,
    };
  },
  methods: {
    recreate() {
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      if (isEmpty(this.game)) {
        const game = new Game({
          canvasElement: canvas,
          // Texture color builder unwired — the map no longer parses the image.
          // Positioning is moving to the virtual hex grid (placed via the editor).
          mapElement: null,
          store: this.$store,
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
