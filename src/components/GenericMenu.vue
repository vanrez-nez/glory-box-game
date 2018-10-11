<template>
  <ul class="GenericMenu" v-hotkey="keymap">
    <li class="GenericMenu-item"
      :class='getMenuItemModifiers(index)'
      v-for="(item, index) in items"
      :key="index"
    >
      <menu-anchor
          ref="menuItem"
          :href='item.href'
          :routeName='item.routeName'
          :target='item.target'
          @click="(item.onClick || noop)()"
        >
          {{item.text}}
        </menu-anchor>
    </li>
  </ul>
</template>

<script>
import MenuAnchor from './MenuAnchor';

export default {
  name: 'GenericMenu',
  components: {
    MenuAnchor,
  },
  data() {
    return {
      noop: () => {},
      selectedIndex: 0,
    };
  },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  activated() {
    this.selectedIndex = 0;
  },
  methods: {
    stepIndex(step) {
      const { menuItem } = this.$refs;
      const itemsCount = menuItem.length;
      let index = (this.selectedIndex + step) % itemsCount;
      if (index < 0) {
        index = itemsCount - 1;
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
        'GenericMenu-listItem--active': isSelected,
      };
    },
    ifActive(fn) {
      return () => {
        // eslint-disable-next-line
        if (!this._inactive) {
          fn();
        }
      };
    },
  },
  computed: {
    keymap() {
      return {
        up: this.ifActive(this.selectPrev),
        down: this.ifActive(this.selectNext),
        tab: this.ifActive(this.selectNext),
        enter: this.ifActive(this.selectCurrent),
      };
    },
  },
};
</script>

<style lang="stylus" src='@styles/components/GenericMenu.styl'></style>
