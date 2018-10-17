<template>
  <ul class="GenericMenu">
    <game-input
      :keyboardBindings="keyboardBindings"
      :gamepadBindings="gamepadBindings"
    >
    </game-input>
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
import GameInput from './GameInput';

export default {
  name: 'GenericMenu',
  components: {
    MenuAnchor,
    GameInput,
  },
  data() {
    return {
      noop: () => {},
      selectedIndex: 0,
    };
  },
  props: {
    vertical: {
      type: Boolean,
      default: false,
    },
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
        'GenericMenu-item--active': isSelected,
      };
    },
    /*
      A guard to avoid processing inputs when
      current component is not active
    */
    ifActive(fn) {
      return () => {
        // eslint-disable-next-line
        if (!this._inactive) {
          fn();
        }
      };
    },
    exit() {
      this.$emit('exit');
    },
  },
  computed: {
    gamepadBindings() {
      const { vertical } = this;
      let bindings = {
        select: this.ifActive(this.selectCurrent),
        back: this.ifActive(this.exit),
        a: this.ifActive(this.selectCurrent),
        b: this.ifActive(this.exit),
      };

      if (vertical) {
        bindings = { ...bindings, ...{
          dpad_down: this.ifActive(this.selectNext),
          dpad_up: this.ifActive(this.selectPrev),
          laxe_up: this.ifActive(this.selectPrev),
          laxe_down: this.ifActive(this.selectNext),
        } };
      } else {
        bindings = { ...bindings, ...{
          dpad_right: this.ifActive(this.selectNext),
          dpad_left: this.ifActive(this.selectPrev),
          laxe_left: this.ifActive(this.selectPrev),
          laxe_right: this.ifActive(this.selectNext),
        } };
      }
      return bindings;
    },
    keyboardBindings() {
      const { vertical } = this;
      let bindings = {
        enter: this.ifActive(this.selectCurrent),
        esc: this.ifActive(this.exit),
      };

      if (vertical) {
        bindings = { ...bindings, ...{
          up: this.ifActive(this.selectPrev),
          down: this.ifActive(this.selectNext),
        } };
      } else {
        bindings = { ...bindings, ...{
          left: this.ifActive(this.selectPrev),
          right: this.ifActive(this.selectNext),
        } };
      }
      return bindings;
    },
  },
};
</script>

<style lang="stylus" src='@styles/components/GenericMenu.styl'></style>
