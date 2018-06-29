const DEFAULT = {
  buffer: null,
  listener: null,
  src: '',
  sprite: {},
  loop: false,
  autoplay: false,
  positional: false,
  refDistance: 0,
  rolloutFactor: 1,
  volume: 1,
  onTrackLoaded: () => {},
  onTrackEnded: () => {},
};

export default class GameAudioTrack {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.sources = [];
    this.currentSprite = null;
    this.init();
  }

  init() {
    const { listener, buffer, volume, loop, refDistance,
      rolloutFactor, autoplay, positional } = this.opts;
    let audio = null;
    if (positional) {
      audio = new THREE.PositionalAudio(listener);
      audio.setRefDistance(refDistance);
      audio.setRolloffFactor(rolloutFactor);
      audio.setMaxDistance(refDistance);
    } else {
      audio = new THREE.Audio(listener);
    }
    audio.setBuffer(buffer);
    audio.setVolume(volume);
    audio.setLoop(loop);
    this.audio = audio;
    if (autoplay) {
      this.play();
    }
  }

  play(spriteId, when = 0) {
    const { audio, opts } = this;
    if (audio.isPlaying) {
      audio.stop();
    }
    this.currentSprite = spriteId;
    let [start, end] = this.range;
    this.playRange(when, start, end);
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.sources.forEach(src => {
      console.log('clear');
      src.stop(0);
      src.onended = null;
      src.disconnect(0);
    });
    if (this.audio.source) {
      this.audio.stop();
    }
  }

  onTrackEnded() {
    this.audio.onEnded();
    this.opts.onTrackEnded();
  }

  /*
    Reimplementation of original play method to support playing ranges
    https://github.com/mrdoob/three.js/blob/master/src/audio/Audio.js#L77
  */
  playRange(when, start, end) {
    const { audio } = this;
    const { loop } = this.opts;
    const source = audio.context.createBufferSource();
    this.sources.push(source);
    source.buffer = audio.buffer;
    audio.startTime = audio.context.currentTime;
    source.onended = this.onTrackEnded.bind(this);
    source.loop = loop;
    audio.source = source;
    audio.isPlaying = true;
    const startSec = start / 1000;
    const endSec = end / 1000;
    const whenSec = when / 1000;
    if (loop) {
      source.loopStart = startSec;
      source.loopEnd = endSec;
      source.start(audio.startTime + whenSec, startSec);
    } else {
      source.start(audio.startTime + whenSec, startSec,
        endSec - startSec);
    }
    audio.connect();
  }

  get range() {
    const { currentSprite } = this;
    const { sprite } = this.opts;
    return sprite[currentSprite] || [0, Infinity];
  }
}
