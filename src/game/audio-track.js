const DEFAULT = {
  loader: null,
  listener: null,
  src: '',
  sprite: {},
  loop: false,
  autoplay: false,
  volume: 1,
};

export default class GameAudioTrack {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.audio = new THREE.Audio(opts.listener);
    this.load();
  }

  load() {
    const { audio } = this;
    const { src, loader, loop, autoplay, volume } = this.opts;
    audio.autoplay = autoplay;
    loader.load(src, (buffer) => {
      audio.setBuffer(buffer);
      audio.setLoop(loop);
      audio.setVolume(volume);
    });
  }

  play(spriteId) {
    const { audio, opts } = this;
    if (opts.sprite[spriteId]) {
      const range = opts.sprite[spriteId];
      this.playRange(range[0], range[1]);
    } else {
      if (audio.isPlaying) {
        audio.stop();
      }
      audio.play();
    }
  }

  /*
    Reimplementation of original play method to support playing ranges
    https://github.com/mrdoob/three.js/blob/master/src/audio/Audio.js#L77
  */
  playRange(start, end) {
    const { audio } = this;
    const audioSource = audio.context.createBufferSource();
    audioSource.buffer = audio.buffer;
    audioSource.onEnded = audio.onEnded.bind(audio);
    audio.isPlaying = true;
    audio.source = audioSource;
    audioSource.start(0, start / 1000, end / 1000);
    audio.connect();
  }

  stop() {
    this.audio.stop();
  }
}
