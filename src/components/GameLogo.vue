<template>
  <div class="GameLogo">
    <svg>
      <use xlink:href="#icon-logo"></use>
    </svg>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>

export default {
  name: 'GameLogo',
  data() {
    return {};
  },
  methods: {},
};
</script>

<style lang="stylus" src='@styles/components/GameLogo.styl'></style>
