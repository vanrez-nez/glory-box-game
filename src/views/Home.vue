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

<script>
import ActionBar from '@/components/action-bar';
import GenericMenu from '@/components/generic-menu';
import GameLogo from '@/components/game-logo';

const MAIN_MENU = 'main-menu';
const QUALITY_MENU = 'quality-menu';

export default {
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
    const { gameLogo } = this.$refs;
    this.reset();
    gameLogo.run();
  },
  methods: {
    bindToQuality(quality) {
      return this.onQualitySelect.bind(this, quality);
    },
    onStartActivate() {
      this.activeMenu = QUALITY_MENU;
    },
    onControls() {
      // console.log('controls');
    },
    onQualitySelect() {
      const { gameLogo } = this.$refs;
      gameLogo.stop();
    },
    reset() {
      this.activeMenu = MAIN_MENU;
    },
  },
};
</script>

<style lang="stylus" src='@styles/views/home.styl'></style>
