<template>
  <div class="PauseMenu">
    <generic-menu
      :vertical='true'
      :items='menuItems'
      @exit='onResume'
    ></generic-menu>
    <action-bar></action-bar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PAUSE_GAME } from '@/store/modules/game';
import GenericMenu from './generic-menu.vue';
import ActionBar from './action-bar.vue';

export default defineComponent({
  name: 'PauseMenu',
  components: {
    GenericMenu,
    ActionBar,
  },
  data() {
    return {
      menuItems: [
        {
          text: 'RESUME',
          onClick: this.onResume,
        },
        {
          text: 'RESTART',
          onClick: this.onRestart,
        },
        {
          text: 'MENU',
          to: { name: 'home' },
        },
        {
          text: 'GITHUB',
          href: 'https://github.com/radixzz/glory-box-game',
          target: '_blank',
        },
      ],
    };
  },
  methods: {
    onResume() {
      this.$store.commit(PAUSE_GAME, false);
    },
    onRestart() {
      this.$emit('restart');
    },
  },
});
</script>

<style src="@styles/components/pause-menu.css"></style>
