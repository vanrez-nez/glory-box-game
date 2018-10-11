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
import Game from '../game';

export default {
  name: 'GameStage',
  data() {
    return {
      game: null,
    };
  },
  created() {
    this.$on('restart', this.restart);
    this.$on('pause', this.pause);
    this.$on('resume', this.resume);
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      const { canvas, map } = this.$refs;
      if (this.game === null) {
        this.game = new Game({
          canvasElement: canvas,
          mapElement:  map,
        });
      } else {
        this.restart();
      }
    },
    resume() {
      this.game.resume();
    },
    pause() {
      this.game.pause();
    },
    restart() {
      this.game.restart();
      this.game.resume();
    },
  },
};
</script>
