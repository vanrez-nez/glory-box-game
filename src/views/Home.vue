<template>
  <div class="Home">
    <div class="Home-menuContainer">
      <game-logo></game-logo>
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
import ActionBar from '@/components/ActionBar';
import GenericMenu from '@/components/GenericMenu';
import GameLogo from '@/components/GameLogo';

const LOW_QUALITY = 0;
const MEDIUM_QUALITY = 1;
const HIGH_QUALITY = 2;

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
        { text: 'ABOUT', routeName: 'about' },
      ],
      qualityMenu: [
        { text: 'LOW', onClick: this.bindToQuality(LOW_QUALITY) },
        { text: 'MEDIUM', onClick: this.bindToQuality(MEDIUM_QUALITY) },
        { text: 'HIGH', onClick: this.bindToQuality(HIGH_QUALITY) },
      ],
    };
  },
  components: {
    ActionBar,
    GenericMenu,
    GameLogo,
  },
  activated() {
    this.reset();
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
    onQualitySelect(quality) {
      switch (quality) {
        case LOW_QUALITY:
        case MEDIUM_QUALITY:
        case HIGH_QUALITY:
          this.$router.push('game');
          break;
      }
    },
    reset() {
      this.activeMenu = MAIN_MENU;
    },
  },
};
</script>

<style lang="stylus" src='@styles/views/Home.styl'></style>
