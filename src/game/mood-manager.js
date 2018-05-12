import DefaultMood from './mood-presets/default';

const DEFAULT = {
  engine: null,
  word: null,
  map: null,
  initialMood: DefaultMood,
};

export default class GameMoodManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.transitionTo(this.opts.initialMood, 1.5);
  }

  getColorTween(property, targetColor, time) {
    const colorTo = new THREE.Color(targetColor);
    return TweenMax.to(property, time, {
      r: colorTo.r,
      g: colorTo.g,
      b: colorTo.b,
    });
  }

  transitionEngine(node, time) {
    const { bloomPass, scene, ambientLight } = this.opts.engine;
    const { BloomPass, Scene, AmbientLight } = node;
    const tl = new TimelineMax();
    tl.to(bloomPass, time, { strength: BloomPass.Strength }, 0);
    tl.to(bloomPass, time, { threshold: BloomPass.Threshold }, 0);
    tl.to(bloomPass, time, { radius: BloomPass.Radius }, 0);
    tl.to(scene.fog, time, { density: Scene.FogDensity }, 0);
    tl.add(this.getColorTween(scene.fog.color, Scene.FogColor, time), 0);
    tl.to(ambientLight, time, { intensity: AmbientLight.Intensity }, 0);
    tl.add(this.getColorTween(ambientLight.color, AmbientLight.Color, time), 0);
  }

  transitionTo(moodPreset, time) {
    this.transitionEngine(moodPreset.Engine, time);
  }
}
