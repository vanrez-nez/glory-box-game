<template>
  <component
    :is="el"
    class="MenuAnchor"
    @click="click"
  >
    <slot></slot>
  </component>
</template>

<script>
import { isObjectLike } from 'lodash';

export default {
  name: 'MenuAnchor',
  props: {
    el: {
      type: String,
      default: 'li',
    },
    to: {
      type: [Object, String],
      default: '',
    },
    target: {
      type: String,
      default: '_self',
    },
    href: {
      type: String,
      default: '',
    },
  },
  methods: {
    click(e) {
      const { href, target, to } = this;
      if (to !== '' || isObjectLike(to)) {
        this.$router.push(to);
      } else if (href !== '') {
        window.open(href, target);
      }
      this.$emit('click', e);
    },
  },
};
</script>

<style lang="stylus" src='@styles/components/menu-anchor.styl'></style>
