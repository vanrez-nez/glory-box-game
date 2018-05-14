const DefaultMood = {
  Engine: {
    BloomPass: {
      Strength: 2.07,
      Threshold: 0.54,
      Radius: 1.1,
      HighPassColor: 0x0,
    },
    Scene: {
      FogColor: 0x070011,
      FogDensity: 0.022,
    },
    AmbientLight: {
      Color: 0x8ad8f0,
      Intensity: 1,
    },
  },
  World: {
    CylinderMaterial: {
      Color: 0x4578c0,
      Emissive: 0x0059ff,
      EmissiveIntensity: 2,
      EnvMapIntensity: 2,
      Metalness: 0.83,
      Roughness: 0.4,
    },
    FloorMaterial: {
      Color: 0x473f69,
      Emissive: 0x0,
      EmissiveIntensity: 1,
      EnvMapIntensity: 0.92,
      Metalness: 1,
      Roughness: 0.37,
    },
    Skytube: {
      Color: 0x653ee3,
      Intensity: 0.35,
      Fade: 0.92,
      Zoom: 2.5,
      StepSize: 0.25,
      Tile: 0.65,
      Transverse: 2,
    },
  },
  Map: {
    Platforms: {
      GenericMaterial: {
        Color: 0xffffff,
        Emissive: 0x0,
        EmissiveIntensity: 1,
        EnvMapIntensity: 1,
        Metalness: 0.5,
        Roughness: 0.5,
      },
      StaticLightMaterial: {
        Color: 0xfffff,
        Emissive: 0x3789ff,
        EmissiveIntensity: 2,
      },
      MovingLightMaterial: {
        Color: 0xffffff,
        Emissive: 0xff8700,
        EmissiveIntensity: 2,
      },
    },
  },
};

export default DefaultMood;
