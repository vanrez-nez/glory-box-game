import { AUDIO_ASSETS } from '@/game/assets';
import GameAudioTrack from '@/game/audio/audio-track';
import GameAudioMix from '@/game/audio/audio-mix';

const DEFAULT = {};

export class GameAudioManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.tracks = {};
    this.mixes = {};
    this.buffers = {};
    this.listener = new THREE.AudioListener();
    this.loader = new THREE.AudioLoader();
    this.loaded = false;
    this.queued = [];
    this.preload([
      // AUDIO_ASSETS.FxJump,
      // 'static/audio/loop_drums.wav',
      // 'static/audio/jump_alt.wav',
      // 'static/audio/wind_loop.wav',
      // 'static/audio/dragon_near.wav',
      // 'static/audio/electric_charge_dim.wav',
      // 'static/audio/electric_blast.wav',
      // 'static/audio/collect.wav',
      // 'static/audio/foot_step.wav',
      // 'static/audio/player_hit.wav',
      // 'static/audio/drama_end.wav',
      // 'static/audio/dragon_roar.wav',
    ]);
  }

  preload(items) {
    const { loader } = this;
    this.itemsLeft = items.length;
    items.forEach(item => loader.load(item, this.onItemLoaded.bind(this, item)));
  }

  onItemLoaded(src, buffer) {
    this.buffers[src] = buffer;
    if (--this.itemsLeft === 0) {
      this.onLoaderFinished();
    }
  }

  onLoaderFinished() {
    this.loaded = true;
    this.initTracks();
    this.initMixes();
    this.processQueued();
  }

  initTracks() {
    const { buffers } = this;
    // this.load('game_play_music', {
    //   src: AUDIO_ASSETS.MainBackgroundWebm,
    //   loop: true,
    //   autoplay: true,
    //   volume: 0.2,
    // });

    // this.load('theme', {
    //   src: 'static/audio/theme.webm',
    //   loop: true,
    //   autoplay: true,
    //   volume: 0.7,
    // });

    // this.load('fx', {
    //   src: AUDIO_ASSETS.FxSprite,
    //   sprite: {
    //     jump_1: [0, 200],
    //   },
    // });

    this.loadTrack('dragon_roar', {
      buffer: buffers['static/audio/dragon_roar.wav'],
    });

    this.loadTrack('drama_end', {
      buffer: buffers['static/audio/drama_end.wav'],
    });

    this.loadTrack('jump_1', {
      buffer: buffers[AUDIO_ASSETS.FxJump],
      volume: 0.7,
    });

    this.loadTrack('wind_loop', {
      buffer: buffers['static/audio/wind_loop.wav'],
      loop: true,
      positional: true,
      autoplay: true,
      refDistance: 50,
      rolloutFactor: 4,
    });

    this.loadTrack('dragon_near_loop', {
      buffer: buffers['static/audio/dragon_near.wav'],
      loop: true,
      positional: true,
      autoplay: true,
      refDistance: 40,
      rolloutFactor: 15,
    });

    this.loadTrack('electric_charge', {
      buffer: buffers['static/audio/electric_charge_dim.wav'],
      volume: 1,
    });

    this.loadTrack('electric_blast', {
      buffer: buffers['static/audio/electric_blast.wav'],
      volume: 1,
    });

    this.loadTrack('collect', {
      buffer: buffers['static/audio/collect.wav'],
    });

    this.loadTrack('foot_step', {
      buffer: buffers['static/audio/foot_step.wav'],
    });

    this.loadTrack('player_hit', {
      buffer: buffers['static/audio/player_hit.wav'],
    });
  }

  initMixes() {
    this.loadMix('game_theme', {
      tracks: {
        drums: {
          buffer: this.buffers['static/audio/loop_drums.wav'],
          sprite: {
            speed_1: [0, 14769],
            speed_2: [14770, 29538],
            speed_3: [29539, 46234],
            speed_4: [46235, 61003],
          },
        },
      },
      mix: [
        { key: 'drums.speed_1', delay: 500, count: 1 },
        { key: 'drums.speed_2', delay: 0, count: 2 },
        { key: 'drums.speed_3', delay: 0, count: 1 },
        { key: 'drums.speed_4', delay: 0, count: Infinity },
      ],
    });
  }

  processQueued() {
    const { queued } = this;
    while (queued.length) {
      const action = queued.pop();
      action();
    }
  }

  mute() {}

  loadMix(mixId, opts) {
    const { mixes, listener } = this;
    mixes[mixId] = new GameAudioMix({
      listener,
      ...opts,
    });
  }

  loadTrack(trackId, opts) {
    const { tracks, listener } = this;
    tracks[trackId] = new GameAudioTrack({
      listener,
      ...opts,
    });
  }

  setPositionalTrackParent(trackId, parent) {
    const { tracks } = this;
    this.executeOnLoad(() => {
      if (tracks[trackId]) {
        parent.add(tracks[trackId].audio);
      }
    });
  }

  executeOnLoad(fn) {
    (this.loaded && fn()) || this.queued.push(fn);
  }

  stopMix(mixId) {
    this.executeOnLoad(() => {
      const { mixes } = this;
      if (mixes[mixId]) {
        mixes[mixId].stop();
      }
    });
  }

  playMix(mixId) {
    this.executeOnLoad(() => {
      const { mixes } = this;
      if (mixes[mixId]) {
        mixes[mixId].play();
      }
    });
  }

  playTrack(trackId, spriteId, when) {
    this.executeOnLoad(() => {
      const { tracks } = this;
      if (tracks[trackId]) {
        tracks[trackId].play(spriteId, when);
      }
    });
  }
}

export const AudioManagerInstance = new GameAudioManager();
