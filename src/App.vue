<template>
  <div id="app" :style='{ opacity: 0 }'>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <game-alert></game-alert>
    <gamepad-monitor></gamepad-monitor>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import gsap from 'gsap';
import Until from '@/common/utils';
import GameAlert from '@/components/game-alert.vue';
import GamepadMonitor from '@/components/gamepad-monitor.vue';

export default defineComponent({
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
      gsap.to(this.$el, { duration: 0.2, opacity: 1, delay: 0.3 });
    },
  },
});
</script>

<style src="@styles/app.css"></style>
