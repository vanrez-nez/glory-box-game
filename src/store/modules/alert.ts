export const SHOW_ALERT = 'alert/show';
export const HIDE_ALERT = 'alert/hide';

const mutations = {
  [SHOW_ALERT](state: any, payload: any) {
    state.title = payload.title;
    state.text = payload.text;
    state.icon = payload.icon;
    state.time = payload.time;
    state.visible = true;
  },
  [HIDE_ALERT](state: any) {
    state.visible = false;
  },
};

const state = {
  visible: false,
  time: 0,
  icon: '',
  title: '',
  text: '',
};

export default { state, mutations };
