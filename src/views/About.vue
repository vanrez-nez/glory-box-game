<template>
  <div class="about">
    <game-input></game-input>
    <h1>This is an about page</h1>
  </div>
</template>

<script>
import GameInput from '@/components/GameInput';

export default {
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
};
</script>
