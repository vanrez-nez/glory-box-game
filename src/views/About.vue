<template>
  <div class="about">
    <game-input></game-input>
    <h1>This is an about page</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GameInput from '@/components/game-input.vue';

export default defineComponent({
  name: 'About',
  components: {
    GameInput,
  },
  computed: {
    keymap() {
      return {
      };
    },
  },
});
</script>
