<template>
  <div class="Game">
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
  name: 'Game',
  data() {
    return {
      game: null,
    };
  },
  props: {
    paused: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    const { canvas, map } = this.$refs;
    this.game = new Game({
      canvasElement: canvas,
      mapElement:  map,
    });
  },
  watch: {
    paused(val) {
      const { game } = this;
      if (val) {
        game.pause();
      } else {
        game.resume();
      }
    },
  },
};
</script>
