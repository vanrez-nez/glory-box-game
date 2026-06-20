<template>
  <div class="DragonDebug">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DragonDebug from '@/debug/dragon-debug';

// DEV-only den-entry visualizer (route guarded by import.meta.env.DEV in router.ts).
export default defineComponent({
  name: 'DragonDebug',
  data() {
    return { harness: null as DragonDebug | null };
  },
  mounted() {
    this.harness = new DragonDebug(this.$refs.canvas as HTMLCanvasElement);
  },
  beforeUnmount() {
    this.harness?.dispose();
    this.harness = null;
  },
});
</script>

<style scoped>
.DragonDebug { position: fixed; inset: 0; background: #000; }
.DragonDebug canvas { display: block; }
</style>
