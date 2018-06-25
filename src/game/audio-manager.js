import { AUDIO_ASSETS } from './assets';
import GameAudioTrack from './audio-track';

const DEFAULT = {};

class GameAudioManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.listener = new THREE.AudioListener();
    this.loader = new THREE.AudioLoader();
    this.tracks = {};
    // this.load('game_play_music', {
    //   src: AUDIO_ASSETS.MainBackgroundWebm,
    //   loop: true,
    //   autoplay: true,
    //   volume: 0.2,
    // });

    this.load('theme', {
      src: 'static/audio/theme.webm',
      loop: true,
      autoplay: true,
      volume: 0.7,
    });

    // this.load('fx', {
    //   src: AUDIO_ASSETS.FxSprite,
    //   sprite: {
    //     jump_1: [0, 200],
    //   },
    // });

    this.load('jump_1', {
      src: 'static/audio/jump_alt.wav',
      volume: 0.7,
    });

    this.load('electric_charge', {
      src: 'static/audio/electric_charge.wav',
    });

    this.load('electric_blast', {
      src: 'static/audio/electric_blast.wav',
    });

    this.load('collect', {
      src: 'static/audio/collect.wav',
    });

    this.load('foot_step', {
      src: 'static/audio/foot_step.wav',
    });

    this.load('player_hit', {
      src: 'static/audio/player_hit.wav',
    });
  }

  load(trackId, opts) {
    const { tracks, listener, loader } = this;
    tracks[trackId] = new GameAudioTrack({
      loader,
      listener,
      ...opts,
    });
  }

  play(trackId, spriteId) {
    const { tracks } = this;
    if (tracks[trackId]) {
      tracks[trackId].play(spriteId);
    }
  }
}

export const AudioManagerInstance = new GameAudioManager();
