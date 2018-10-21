<template>
  <div id="app" :style='{ opacity: 0 }'>
    <keep-alive>
      <router-view/>
    </keep-alive>
    <game-alert></game-alert>
    <gamepad-monitor></gamepad-monitor>
  </div>
</template>

<script>
import Until from '@/common/utils';
import GameAlert from '@/components/game-alert';
import GamepadMonitor from '@/components/gamepad-monitor';

export default {
  name: 'app',
  components: {
    GameAlert,
    GamepadMonitor,
  },
  mounted() {
    this.show();
  },
  methods: {
    async show() {
      await Until(() => sessionStorage.fontsLoaded);
      TweenMax.to(this.$el, 0.2, { opacity: 1, delay: 0.3 });
    },
  },
};
</script>

<style lang="stylus" src="@styles/app.styl"></style>
