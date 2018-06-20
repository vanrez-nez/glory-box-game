import DefaultMood from './default';

const NeutralMood = deepmerge(DefaultMood, {
  Engine: {
    BloomPass: {
      Strength: 2.07,
      Threshold: 0.54,
      Radius: 1.1,
      HighPassColor: 0x0,
    },
    Scene: {
      FogColor: 0x0,
      FogDensity: 0.02,
    },
    AmbientLight: {
      Color: 0xffffff,
      Intensity: 1,
    },
  },
  Materials: {
  },
});

export default NeutralMood;
