<template>
  <div class="ActionBar">
    <div class="ActionBar-button"
      v-for="(button, index) in buttons"
      @click="button.onClick(button)"
      :key="index"
    >
        <div class="ActionBar-svgIcon">
          <svg><use :xlink:href="getIcon(button)"></use></svg>
        </div>
    </div>
  </div>
</template>

<script>
import screenfull from 'screenfull';

const STORAGE_KEY_NAME = 'ActionBar';
export default {
  name: 'ActionBar',
  data() {
    return {
      buttons: [
        {
          name: 'controls',
          active: false,
          on: { hint: 'Gamepad Controls', icon: 'gamepad' },
          off: { hint: 'Keyboard Controls', icon: 'keyboard' },
          onClick: this.onControls,
        },
        {
          name: 'audio',
          active: true,
          on: { hint: 'Unmute', icon: 'audio_enabled' },
          off: { hint: 'Mute', icon: 'audio_disabled' },
          onClick: this.onAudio,
        },
        {
          name: 'fullscreen',
          active: false,
          on: { hint: 'Exit Full Screen', icon: 'fullscreen_disable' },
          off: { hint: 'Full Screen', icon: 'fullscreen_enable' },
          onClick: this.onFullscreen,
        },
      ],
    };
  },
  mounted() {
    this.readConfig();
    this.bindEvents();
    this.readConfig();
    this.updateFullScreen();
  },
  methods: {
    bindEvents() {
      screenfull.on('change', this.updateFullScreen);
    },
    getIcon(button) {
      const iconName = button.active ? button.on.icon : button.off.icon;
      return `#icon-${iconName}`;
    },
    getButton(name) {
      const { buttons } = this;
      return buttons.find(b => b.name === name);
    },
    readConfig() {
      const json = window.localStorage.getItem(STORAGE_KEY_NAME);
      if (json) {
        const audioButton = this.getButton('audio');
        const parsedConfig = JSON.parse(json);
        audioButton.active = parsedConfig.audio;
      }
    },
    writeConfig() {
      const audioButton = this.getButton('audio');
      const json = { audio: audioButton.active };
      window.localStorage.setItem(STORAGE_KEY_NAME, JSON.stringify(json));
    },
    updateFullScreen() {
      const button = this.getButton('fullscreen');
      button.active = screenfull.isFullscreen;
    },
    onFullscreen() {
      if (screenfull.enabled) {
        if (screenfull.isFullscreen) {
          screenfull.exit();
        } else {
          const el = document.getElementById('app');
          screenfull.request(el);
        }
      }
    },
    onAudio(button) {
      button.active = !button.active;
      this.writeConfig();
    },
    onControls(button) {},
  },
};
</script>

<style lang="stylus" src='@styles/components/ActionBar.styl'></style>
