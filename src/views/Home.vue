<template>
  <div class="Home">
    <game-logo ref="gameLogo" class="Home-gameLogo"></game-logo>
    <div class="Home-menuContainer">
      <generic-menu
        class='Home-mainMenu'
        :items='mainMenu'
      >
      </generic-menu>
    </div>
    <action-bar></action-bar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ActionBar from '@/components/action-bar.vue';
import GenericMenu from '@/components/generic-menu.vue';
import GameLogo from '@/components/game-logo.vue';

export default defineComponent({
  name: 'Home',
  data() {
    return {
      mainMenu: [
        { text: 'START', to: { name: 'game' }, onClick: this.onStart },
        { text: 'CONTROLS', onClick: this.onControls },
        { text: 'ABOUT', to: { name: 'about' } },
      ],
    };
  },
  components: {
    ActionBar,
    GenericMenu,
    GameLogo,
  },
  activated() {
    const gameLogo = this.$refs.gameLogo as any;
    gameLogo.run();
  },
  deactivated() {
    // Stop the logo's render loop when leaving Home (e.g. to /about); otherwise
    // it keeps rendering into a 0x0 canvas and the WebGPU backend errors with
    // "swapchain texture of size 0".
    const gameLogo = this.$refs.gameLogo as any;
    gameLogo?.stop();
  },
  methods: {
    onStart() {
      // Stop the logo's render loop before navigating to the game so it doesn't
      // keep rendering into a hidden canvas.
      const gameLogo = this.$refs.gameLogo as any;
      gameLogo.stop();
    },
    onControls() {
      // console.log('controls');
    },
  },
});
</script>

<style src='@styles/views/home.css'></style>
