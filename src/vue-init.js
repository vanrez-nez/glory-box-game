import VueHotKey from 'v-hotkey';
import Vue from 'vue';
import App from './App';
import router from './router';

Vue.config.productionTip = false;

// https://github.com/Dafrok/v-hotkey
Vue.use(VueHotKey);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
