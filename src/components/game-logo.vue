<template>
  <div class="GameLogo" v-resize.debounce="updateSize">
    <canvas ref="canvas"></canvas>
    <svg>
      <use xlink:href="#icon-logo"></use>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { markRaw } from 'vue';
import GameLogo from './game-logo/main';

export default defineComponent({
  name: 'GameLogo',
  data() {
    return {
      instance: null as GameLogo | null,
    };
  },
  methods: {
    run() {
      this.recreate();
      this.instance!.run();
      this.updateSize();
    },
    stop() {
      this.instance!.stop();
    },
    recreate() {
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      if (this.instance === null) {
        // markRaw: keep the three.js engine out of Vue's reactivity proxy,
        // otherwise three's non-configurable matrix props break the renderer.
        this.instance = markRaw(new GameLogo({
          canvasElement: canvas,
        }));
      }
    },
    updateSize() {
      const { clientWidth: w, clientHeight: h } = this.$el;
      const { instance } = this;
      if (instance !== null) {
        instance.resize(w, h);
      }
    },
  },
});
</script>

<style src='@styles/components/game-logo.css'></style>
