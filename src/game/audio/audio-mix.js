import GameAudioTrack from './audio-track';

const DEFAULT = {
  listener: null,
  mix: [],
  tracks: {},
};

export default class GameAudioMix {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.instances = [];
    this.initMix();
  }

  initMix() {
    const { mix, tracks, listener } = this.opts;
    mix.forEach((t) => {
      const { key, delay } = t;
      const [trackName, spriteId] = key.split('.');
      if (key) {
        const descriptor = tracks[trackName];
        if (descriptor) {
          const loop = t.count === Infinity;
          const count = loop ? 1 : t.count || 1;
          for (let i = 0; i < count; i++) {
            const track = new GameAudioTrack({
              ...descriptor,
              loop,
              listener,
            });
            track.currentSprite = spriteId;
            const [start, end] = track.range;
            const duration = end - start;
            this.instances.push([track, spriteId,
              duration, delay]);
            /*
              if loop is enabled on this track then it will repeat
              indefinetly so we stop processing the mix
            */
            if (track.loop) {
              break;
            }
          }
        }
      }
    });
  }

  play() {
    const { instances } = this;
    let prevTime = 0;
    instances.forEach((instance) => {
      const [track, spriteId, duration, delay] = instance;
      track.play(spriteId, prevTime + delay);
      prevTime += duration + delay;
    });
  }

  pause() {
    this.instances.forEach((instance) => {
      const [track] = instance;
      track.pause();
    });
  }

  stop() {
    this.instances.forEach((instance) => {
      const [track] = instance;
      track.stop();
    });
  }
}
