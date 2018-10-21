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

<script>
import { mapState } from 'vuex';
import { HIDE_ALERT } from '@/store/modules/alert';

export default {
  name: 'GameAlert',
  data() {
    return {
      timeline: null,
    };
  },
  methods: {
    show(el, done) {
      const { $store } = this;
      const tl = new TimelineMax();
      tl.to(el, 0.5, {
        opacity: 1,
        onComplete: done,
      });
      tl.add(() => {
        $store.commit(HIDE_ALERT);
      }, this.time);
    },
    hide(el, done) {
      TweenMax.to(el, 0.25, {
        opacity: 0,
        onComplete: done,
      });
    },
  },
  computed: {
    ...mapState({
      visible: state => state.alert.visible,
      title: state => state.alert.title,
      text: state => state.alert.text,
      icon: state => state.alert.icon,
      time: state => state.alert.time,
    }),
  },
};
</script>

<style lang="stylus" src='@styles/components/game-alert.styl'></style>
