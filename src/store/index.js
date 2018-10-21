import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import game from '@/store/modules/game';
import alert from '@/store/modules/alert';

Vue.use(Vuex);

const state = {};
export default new Store({
  state,
  modules: {
    game,
    alert,
  },
});
