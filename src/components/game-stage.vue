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

<script>
import { isObject, isEmpty } from 'lodash';
import { EVENTS } from '@/game/const';
import Game from '@/game/main';
import mapBugUrl from '@/assets/images/jumper_map_bug.png';

export default {
  name: 'GameStage',
  data() {
    return {
      prevQuality: '',
      mapBugUrl,
    };
  },
  methods: {
    recreate(quality) {
      const { canvas, map } = this.$refs;
      if (this.prevQuality !== quality) {
        this.prevQuality = quality;
        this.destroy();
      }
      if (isEmpty(this.game)) {
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
      if (isObject(this.game)) {
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
