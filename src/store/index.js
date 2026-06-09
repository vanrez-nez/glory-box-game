import { createStore } from 'vuex';
import game from '@/store/modules/game';
import alert from '@/store/modules/alert';

const state = {};
export default createStore({
  state,
  modules: {
    game,
    alert,
  },
});
