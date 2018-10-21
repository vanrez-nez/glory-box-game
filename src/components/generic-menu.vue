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
import MenuAnchor from './menu-anchor';
import GameInput from './game-input';

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
        Select: this.ifActive(this.selectCurrent),
        Back: this.ifActive(this.exit),
        A: this.ifActive(this.selectCurrent),
        B: this.ifActive(this.exit),
      };

      if (vertical) {
        bindings = { ...bindings, ...{
          DpadDown: this.ifActive(this.selectNext),
          DpadUp: this.ifActive(this.selectPrev),
        } };
      } else {
        bindings = { ...bindings, ...{
          DpadRight: this.ifActive(this.selectNext),
          DpadLeft: this.ifActive(this.selectPrev),
        } };
      }
      return bindings;
    },
    keyboardBindings() {
      const { vertical } = this;
      let bindings = {
        Enter: this.ifActive(this.selectCurrent),
        Escape: this.ifActive(this.exit),
      };

      if (vertical) {
        bindings = { ...bindings, ...{
          ArrowUp: this.ifActive(this.selectPrev),
          ArrowDown: this.ifActive(this.selectNext),
        } };
      } else {
        bindings = { ...bindings, ...{
          ArrowLeft: this.ifActive(this.selectPrev),
          ArrowRight: this.ifActive(this.selectNext),
        } };
      }
      return bindings;
    },
  },
};
</script>

<style lang="stylus" src='@styles/components/generic-menu.styl'></style>
