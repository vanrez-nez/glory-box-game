<template>
  <transition name="GameLoader-fade">
    <div class="GameLoader" v-if="visible">
      <div class="GameLoader-spinner"></div>
      <p class="GameLoader-label">{{ label }}</p>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// Full-screen overlay shown while the game loads (assets + map worker + first
// chunk build), so the half-built scene / WebGPU warm-up frame isn't visible.
// The owner toggles `visible`; the component owns the look + fade-out.
export default defineComponent({
  name: 'GameLoader',
  props: {
    visible: { type: Boolean, default: false },
    label: { type: String, default: 'LOADING' },
  },
});
</script>

<style src='@styles/components/game-loader.css'></style>
