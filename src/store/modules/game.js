export const PAUSE_GAME = 'game/pause-game';
export const GAMEPAD = 'game/game-pad';

const mutations = {
  [PAUSE_GAME](state, value) {
    state.paused = value;
  },
  [GAMEPAD](state, value) {
    state.gamepad = value;
  },
};

const state = {
  paused: false,
  gamepad: false,
};

export default { state, mutations };
