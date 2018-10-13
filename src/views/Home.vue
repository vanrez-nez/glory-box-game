<template>
  <div class="Home" v-hotkey="keymap">
    <generic-menu
      class='Home-mainMenu'
      v-if="activeMenu === 'main-menu'"
      :items='mainMenu'
    >
    </generic-menu>
    <generic-menu
      v-if="activeMenu === 'quality-menu'"
      :items='qualityMenu'>
    </generic-menu>
  </div>
</template>

<script>
import GenericMenu from '@/components/GenericMenu';

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
    GenericMenu,
  },
  activated() {
    this.activeMenu = MAIN_MENU;
  },
  methods: {
    bindToQuality(quality) {
      return this.onQualitySelect.bind(this, quality);
    },
    onStartActivate() {
      this.activeMenu = QUALITY_MENU;
    },
    onControls() {
      console.log('controls');
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
  },
  computed: {
    keymap() {
      return {
        esc: () => {
          this.activeMenu = MAIN_MENU;
        },
      };
    },
  },
};
</script>

<style lang="stylus" src='@styles/views/Home.styl'></style>
