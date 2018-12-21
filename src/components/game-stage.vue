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
import Game from '@/game/main';

export default {
  name: 'GameStage',
  data() {
    return {
      game: null,
    };
  },
  created() {
    this.$on('restart', this.restart);
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
          store: this.$store,
        });
      } else {
        // this.restart();
      }
    },
    restart() {
      const { game } = this;
      // game.restart();
      // game.resume();
    },
  },
};
</script>
