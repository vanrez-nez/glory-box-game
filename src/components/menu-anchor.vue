<template>
  <router-link
    class="MenuAnchor"
    v-if='isRouter'
    :to="{name: routeName}"
    @click.native="$emit('click')"
  >
    <slot></slot>
  </router-link>
  <a v-else
    class="MenuAnchor"
    :href="href"
    @click="$emit('click')"
    :target='target'
  >
    <slot></slot>
  </a>
</template>

<script>
export default {
  name: 'MenuAnchor',
  props: {
    target: {
      type: String,
      default: '_self',
    },
    href: {
      type: String,
      default: '#',
    },
    routeName: {
      type: String,
      default: '',
    },
  },
  computed: {
    isRouter() {
      return this.routeName !== '';
    },
  },
};
</script>

<style lang="stylus" src='@styles/components/menu-anchor.styl'></style>
