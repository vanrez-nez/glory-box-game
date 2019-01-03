<template>
  <div class="ActionBar">
    <div class="ActionBar-button"
      v-for="(button, index) in buttons"
      @click="button.onClick(button)"
      :key="index"
    >
        <div class="ActionBar-text" v-text='getHint(button)'></div>
        <svg class="ActionBar-svgIcon">
          <use :xlink:href="getIcon(button)">
        </use></svg>
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
          checked: false,
          on: { hint: 'Gamepad Controls', icon: 'gamepad' },
          off: { hint: 'Keyboard Controls', icon: 'keyboard' },
          onClick: this.onControls,
        },
        {
          name: 'audio',
          checked: true,
          on: { hint: 'Mute', icon: 'audio_enabled' },
          off: { hint: 'Unmute', icon: 'audio_disabled' },
          onClick: this.onAudio,
        },
        {
          name: 'fullscreen',
          checked: false,
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
    getHint(button) {
      return button.checked ? button.on.hint : button.off.hint;
    },
    bindEvents() {
      screenfull.on('change', this.updateFullScreen);
    },
    getIcon(button) {
      const iconName = button.checked ? button.on.icon : button.off.icon;
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
        audioButton.checked = parsedConfig.audio;
      }
    },
    writeConfig() {
      const audioButton = this.getButton('audio');
      const json = { audio: audioButton.checked };
      window.localStorage.setItem(STORAGE_KEY_NAME, JSON.stringify(json));
    },
    updateFullScreen() {
      const button = this.getButton('fullscreen');
      button.checked = screenfull.isFullscreen;
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
      button.checked = !button.checked;
      this.writeConfig();
    },
    onControls(button) {},
  },
};
</script>

<style lang="stylus" src='@styles/components/action-bar.styl'></style>
