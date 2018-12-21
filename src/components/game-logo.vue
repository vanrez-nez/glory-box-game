<template>
  <div class="GameLogo" v-resize.debounce="updateSize">
    <canvas ref="canvas"></canvas>
    <svg>
      <use xlink:href="#icon-logo"></use>
    </svg>
  </div>
</template>

<script>
import GameLogo from './game-logo/main'

export default {
  name: 'GameLogo',
  data() {
    return {
      instance: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      const { canvas } = this.$refs;
      if (this.instance === null) {
        this.instance = new GameLogo({
          canvasElement: canvas,
        });
      }
      this.instance.resume();
      this.updateSize();
    },
    updateSize() {
      const { clientWidth: w, clientHeight: h } = this.$el;
      const { instance } = this
      if (instance !== null) {
        instance.resize(w, h);
      }
    }
  },
};
</script>

<style lang="stylus" src='@styles/components/game-logo.styl'></style>
