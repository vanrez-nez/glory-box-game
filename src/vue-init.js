import resize from 'vue-resize-directive';
import Vue from 'vue';
import App from '@/app';
import router from '@/router';
import store from '@/store';

Vue.config.productionTip = false;

// VUE DIRECTIVES
Vue.directive('resize', resize);

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app');
