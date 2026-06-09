<template>
  <div class="GameAlert">
    <transition @enter='show' @leave='hide'>
      <div class="GameAlert-wrapper" v-if='visible'>
        <h1 class="GameAlert-title">
          <span>
              <svg class="GameAlert-icon">
                <use :xlink:href="`#${icon}`">
              </use></svg>
          </span>
          {{title}}
        </h1>
        <p class="GameAlert-text">{{text}}</p>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import gsap from 'gsap';
import { mapState } from 'vuex';
import { HIDE_ALERT } from '@/store/modules/alert';

export default defineComponent({
  name: 'GameAlert',
  data() {
    return {
      timeline: null,
    };
  },
  methods: {
    show(el: any, done: any) {
      const { $store } = this;
      const tl = gsap.timeline();
      tl.to(el, {
        duration: 0.5,
        opacity: 1,
        onComplete: done,
      });
      tl.add(() => {
        $store.commit(HIDE_ALERT);
      }, this.time);
    },
    hide(el: any, done: any) {
      gsap.to(el, {
        duration: 0.25,
        opacity: 0,
        onComplete: done,
      });
    },
  },
  computed: {
    ...mapState({
      visible: (state: any) => state.alert.visible,
      title: (state: any) => state.alert.title,
      text: (state: any) => state.alert.text,
      icon: (state: any) => state.alert.icon,
      time: (state: any) => state.alert.time,
    }),
  },
});
</script>

<style src='@styles/components/game-alert.css'></style>
