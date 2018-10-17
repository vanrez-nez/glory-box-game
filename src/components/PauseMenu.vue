<template>
  <div class="PauseMenu">
    <generic-menu
      :vertical='true'
      :items='menuItems'
      @exit='onMenuExit'
    ></generic-menu>
    <action-bar></action-bar>
  </div>
</template>

<script>
import GenericMenu from './GenericMenu';
import ActionBar from './ActionBar';

export default {
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
          routeName: 'home',
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
    onMenuExit() {
      this.$emit('menuExit');
    },
    onResume() {
      this.$emit('resume');
    },
    onRestart() {
      this.$emit('restart');
    },
  },
};
</script>

<style lang="stylus" src="@styles/components/PauseMenu.styl"></style>
