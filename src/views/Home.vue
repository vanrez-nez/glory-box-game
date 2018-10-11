<template>
  <div class="Home">
    <generic-menu
      v-if='mainMenuVisible'
      :items='mainMenu'
    >
    </generic-menu>
    <generic-menu
      v-if='qualityMenuVisible'
      :items='qualityMenu'>
    </generic-menu>
  </div>
</template>

<script>
import GenericMenu from '@/components/GenericMenu';

const LOW_QUALITY = 0;
const MEDIUM_QUALITY = 1;
const HIGH_QUALITY = 2;

export default {
  name: 'Home',
  data() {
    return {
      mainMenuVisible: true,
      qualityMenuVisible: false,
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
    this.mainMenuVisible = true;
    this.qualityMenuVisible = false;
  },
  methods: {
    bindToQuality(quality) {
      return this.onQualitySelect.bind(this, quality);
    },
    onStartActivate() {
      this.mainMenuVisible = false;
      this.qualityMenuVisible = true;
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
};
</script>

<style lang="stylus" src='@styles/views/Home.styl'></style>
