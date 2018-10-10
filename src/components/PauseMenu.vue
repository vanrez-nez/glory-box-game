<template>
  <div class="PauseMenu" v-hotkey="keymap">
    <ul class="PauseMenu-list">
      <li class="PauseMenu-listItem"
        :class='getMenuItemModifiers(index)'
        v-for='(item, index) in menuItems'
        :key='index'
      >
        <menu-anchor
          ref="menuItem"
          :href='item.href'
          :routerTo='item.to'
          :target='item.target'
          @click="(item.onClick || noop)()"
        >
          {{item.text}}
        </menu-anchor>
      </li>
    </ul>
  </div>
</template>

<script>
import MenuAnchor from './MenuAnchor';

export default {
  name: 'PauseMenu',
  data() {
    return {
      noop: () => {},
      selectedIndex: 0,
      menuItems: [
        {
          text: 'RESUME',
          href: '#',
          onClick: this.onResume,
        },
        {
          text: 'RESTART',
          href: '#',
          onClick: this.onRestart,
        },
        {
          text: 'MENU',
          to: 'home',
        },
        {
          text: 'GITHUB',
          href: 'https://github.com/radixzz/glory-box-game',
          target: '_blank',
        },
      ],
    };
  },
  components: {
    MenuAnchor,
  },
  methods: {
    onResume() {
      this.$emit('resume');
    },
    onRestart() {
      this.$emit('restart');
    },
    stepIndex(step) {
      let index = (this.selectedIndex + step) % 4;
      if (index < 0) {
        index = 3;
      }
      this.selectedIndex = index;
    },
    selectNext() {
      this.stepIndex(1);
    },
    selectPrev() {
      this.stepIndex(-1);
    },
    selectCurrent() {
      const { menuItem } = this.$refs;
      const { selectedIndex } = this;
      menuItem[selectedIndex].$el.click();
    },
    getMenuItemModifiers(idx) {
      const { selectedIndex } = this;
      const isSelected = idx === selectedIndex;
      return {
        'PauseMenu-listItem--active': isSelected,
      };
    },
  },
  computed: {
    keymap() {
      return {
        up: this.selectPrev,
        down: this.selectNext,
        tab: this.selectNext,
        enter: this.selectCurrent,
      };
    },
  },
};
</script>

<style lang="stylus" src="@styles/components/PauseMenu.styl"></style>
