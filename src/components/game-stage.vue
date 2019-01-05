<template>
  <div class="GameStage">
    <img
      class="hidden"
      ref="map"
      :src="require('!!url-loader!@/assets/images/jumper_map_bug.png')"
    />
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { EVENTS } from '@/game/const';
import Game from '@/game/main';

export default {
  name: 'GameStage',
  data() {
    return {
      game: null,
      prevQuality: '',
    };
  },
  methods: {
    recreate(quality) {
      const { canvas, map } = this.$refs;
      if (this.prevQuality !== quality) {
        this.prevQuality = quality;
        this.destroy();
      }
      if (this.game === null) {
        this.game = new Game({
          canvasElement: canvas,
          mapElement:  map,
          store: this.$store,
          quality,
        });
        this.game.events.on(EVENTS.GameReady, () => {
          this.$emit('ready');
        });
      } else {
        this.$emit('ready');
      }
    },
    destroy() {
      if (this.game !== null) {
        this.game.dispose();
        this.game = null;
      }
    },
    restart() {
      const { game } = this;
      game.restart();
      game.resume();
    },
  },
};
</script>
