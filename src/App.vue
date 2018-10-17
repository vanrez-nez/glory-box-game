<template>
  <div id="app">
    <keep-alive>
      <router-view/>
    </keep-alive>
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
};
</script>

<style lang="stylus" src="@styles/App.styl"></style>
