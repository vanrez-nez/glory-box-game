<template>
  <ul class="GenericMenu">
    <game-input
      :keyboardBindings="keyboardBindings"
      :gamepadBindings="gamepadBindings"
    >
    </game-input>
    <menu-anchor
        ref="menuItem"
        class="GenericMenu-item"
        :class='getMenuItemModifiers(index)'
        v-for="(item, index) in items"
        :key="index"
        :href='item.href'
        :target='item.target'
        :to='item.to'
        @click="(item.onClick || noop)()"
      >
        {{item.text}}
      </menu-anchor>
  </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import MenuAnchor from './menu-anchor.vue';
import GameInput from './game-input.vue';

export default defineComponent({
  name: 'GenericMenu',
  components: {
    MenuAnchor,
    GameInput,
  },
  data() {
    return {
      noop: () => {},
      selectedIndex: 0,
      isActive: true,
    };
  },
  props: {
    vertical: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
  },
  activated() {
    this.selectedIndex = 0;
    this.isActive = true;
  },
  deactivated() {
    this.isActive = false;
  },
  methods: {
    stepIndex(step: any) {
      const menuItem = this.$refs.menuItem as any[];
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
      const menuItem = this.$refs.menuItem as any[];
      const { selectedIndex } = this;
      menuItem[selectedIndex].$el.click();
    },
    getMenuItemModifiers(idx: any) {
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
    ifActive(fn: any) {
      return () => {
        if (this.isActive) {
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
});
</script>

<style src='@styles/components/generic-menu.css'></style>
