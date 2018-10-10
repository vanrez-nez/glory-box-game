<template>
  <router-link v-if='isRouter'
    :name="routerName"
    @click.native="$emit('click')"
  >
    <slot></slot>
  </router-link>
  <a v-else
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
    routerName: {
      type: String,
      default: '',
    },
  },
  computed: {
    isRouter() {
      return this.routerName !== '';
    },
  },
};
</script>
