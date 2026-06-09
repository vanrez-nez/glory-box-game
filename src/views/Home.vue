<template>
  <div class="Home">
    <game-logo ref="gameLogo" class="Home-gameLogo"></game-logo>
    <div class="Home-menuContainer">
      <template v-if="activeMenu === 'main-menu'">
        <generic-menu
          class='Home-mainMenu'
          :items='mainMenu'
        >
        </generic-menu>
      </template>
      <template v-if="activeMenu === 'quality-menu'">
        <p class="Home-menuTitle">Graphics Quality</p>
        <generic-menu
          :items='qualityMenu'
          @exit='reset'
        >
        </generic-menu>
      </template>
    </div>
    <action-bar></action-bar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ActionBar from '@/components/action-bar.vue';
import GenericMenu from '@/components/generic-menu.vue';
import GameLogo from '@/components/game-logo.vue';

const MAIN_MENU = 'main-menu';
const QUALITY_MENU = 'quality-menu';

export default defineComponent({
  name: 'Home',
  data() {
    return {
      activeMenu: MAIN_MENU,
      mainMenu: [
        { text: 'START', onClick: this.onStartActivate },
        { text: 'CONTROLS', onClick: this.onControls },
        { text: 'ABOUT', to: { name: 'about' } },
      ],
      qualityMenu: [
        {
          text: 'LOW',
          to: { name: 'game', params: { quality: 'low' } },
          onClick: this.onQualitySelect,
        },
        {
          text: 'MEDIUM',
          to: { name: 'game', params: { quality: 'medium' } },
          onClick: this.onQualitySelect,
        },
        {
          text: 'HIGH',
          to: { name: 'game', params: { quality: 'high' } },
          onClick: this.onQualitySelect,
        },
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
    this.reset();
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
    bindToQuality(quality: any) {
      return this.onQualitySelect.bind(this, quality);
    },
    onStartActivate() {
      this.activeMenu = QUALITY_MENU;
    },
    onControls() {
      // console.log('controls');
    },
    onQualitySelect(_quality?: any) {
      const gameLogo = this.$refs.gameLogo as any;
      gameLogo.stop();
    },
    reset() {
      this.activeMenu = MAIN_MENU;
    },
  },
});
</script>

<style src='@styles/views/home.css'></style>
