import * as THREE from 'three/webgpu';
import loader from '@/loader';
import GameAudioTrack from '@/game/audio/audio-track';
import GameAudioMix from '@/game/audio/audio-mix';

const DEFAULT = {};

// Manifest audio ids this manager needs (see public/manifest.json). Loaded via
// THREE.AudioLoader so the decoded AudioBuffers share the listener's AudioContext.
const AUDIO_IDS = [
  'dragonRoar', 'dramaEnd', 'jumpAlt', 'windLoop', 'dragonNear',
  'electricChargeDim', 'electricBlast', 'collect', 'footStep', 'playerHit',
  'loopDrums',
];

export class GameAudioManager {
  opts!: Record<string, any>;
  tracks!: Record<string, any>;
  mixes!: Record<string, any>;
  buffers!: Record<string, any>;
  listener!: THREE.AudioListener;
  loader!: THREE.AudioLoader;
  loaded!: boolean;
  queued!: any[];
  itemsLeft!: any;
  constructor(opts: any = {}) {
    this.opts = { ...DEFAULT, ...opts };
    this.tracks = {};
    this.mixes = {};
    this.buffers = {};
    this.listener = new THREE.AudioListener();
    this.loader = new THREE.AudioLoader();
    this.loaded = false;
    this.queued = [];
    this.resumeOnGesture();
  }

  // Browsers block the AudioContext until a user gesture; resume it on the first
  // interaction so autoplay loops + SFX actually sound.
  resumeOnGesture() {
    const ctx = THREE.AudioContext.getContext() as AudioContext;
    const resume = () => {
      if (ctx.state === 'suspended') { ctx.resume(); }
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('touchstart', resume);
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    window.addEventListener('touchstart', resume);
  }

  // Called once the asset manifest is loaded (see GameLoader). Resolves each audio
  // id to its manifest URL and decodes it into an AudioBuffer keyed by id.
  async load() {
    await Promise.all(AUDIO_IDS.map((id) => new Promise<void>((resolve) => {
      const entry = loader.getEntry(id);
      if (!entry) {
        console.warn(`[audio] missing manifest entry: "${id}"`);
        resolve();
        return;
      }
      this.loader.load(
        entry.src as string,
        (buffer) => { this.buffers[id] = buffer; resolve(); },
        undefined,
        () => { console.warn(`[audio] failed to load: "${id}"`); resolve(); },
      );
    })));
    this.onLoaderFinished();
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
      buffer: buffers.dragonRoar,
    });

    this.loadTrack('drama_end', {
      buffer: buffers.dramaEnd,
    });

    this.loadTrack('jump_1', {
      buffer: buffers.jumpAlt,
      volume: 0.7,
    });

    this.loadTrack('wind_loop', {
      buffer: buffers.windLoop,
      loop: true,
      positional: true,
      autoplay: true,
      refDistance: 50,
      rolloutFactor: 4,
    });

    this.loadTrack('dragon_near_loop', {
      buffer: buffers.dragonNear,
      loop: true,
      positional: true,
      autoplay: true,
      refDistance: 40,
      rolloutFactor: 15,
    });

    this.loadTrack('electric_charge', {
      buffer: buffers.electricChargeDim,
      volume: 1,
    });

    this.loadTrack('electric_blast', {
      buffer: buffers.electricBlast,
      volume: 1,
    });

    this.loadTrack('collect', {
      buffer: buffers.collect,
    });

    this.loadTrack('foot_step', {
      buffer: buffers.footStep,
    });

    this.loadTrack('player_hit', {
      buffer: buffers.playerHit,
    });
  }

  initMixes() {
    this.loadMix('game_theme', {
      tracks: {
        drums: {
          buffer: this.buffers.loopDrums,
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

  loadMix(mixId: any, opts: any) {
    const { mixes, listener } = this;
    mixes[mixId] = new GameAudioMix({
      listener,
      ...opts,
    });
  }

  loadTrack(trackId: any, opts: any) {
    const { tracks, listener } = this;
    tracks[trackId] = new GameAudioTrack({
      listener,
      ...opts,
    });
  }

  setPositionalTrackParent(trackId: any, parent: any) {
    const { tracks } = this;
    this.executeOnLoad(() => {
      if (tracks[trackId]) {
        parent.add(tracks[trackId].audio);
      }
    });
  }

  executeOnLoad(fn: any) {
    (this.loaded && fn()) || this.queued.push(fn);
  }

  stopMix(mixId: any) {
    this.executeOnLoad(() => {
      const { mixes } = this;
      if (mixes[mixId]) {
        mixes[mixId].stop();
      }
    });
  }

  playMix(mixId: any) {
    this.executeOnLoad(() => {
      const { mixes } = this;
      if (mixes[mixId]) {
        mixes[mixId].play();
      }
    });
  }

  playTrack(trackId: any, spriteId?: any, when?: any) {
    this.executeOnLoad(() => {
      const { tracks } = this;
      if (tracks[trackId]) {
        tracks[trackId].play(spriteId, when);
      }
    });
  }
}

export const AudioManagerInstance = new GameAudioManager();
