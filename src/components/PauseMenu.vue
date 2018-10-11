<template>
  <div class="PauseMenu">
    <generic-menu :items='menuItems'></generic-menu>
  </div>
</template>

<script>
import GenericMenu from './GenericMenu';

export default {
  name: 'PauseMenu',
  components: {
    GenericMenu,
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
