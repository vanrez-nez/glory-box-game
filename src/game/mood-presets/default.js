const DefaultMood = {
  Engine: {
    BloomPass: {
      Strength: 1.14,
      Threshold: 0.53,
      Radius: 0.63,
      HighPassColor: 0x0,
    },
    Scene: {
      FogColor: 0x0,
      FogDensity: 0.02,
    },
    AmbientLight: {
      Color: 0x1e02f5,
      Intensity: 1,
    },
  },
  Map: {
    CylinderMaterial: {
      Color: 0x2c3d55,
      Emissive: 0x00ffff,
      EmissiveIntensity: 0.7,
      EnvMapIntensity: 1,
      Metalness: 0.6,
      Roughness: 0.6,
    },
    FloorMaterial: {
      Color: 0xffffff,
      Emissive: 0x0,
      EmissiveIntensity: 1,
      EnvMapIntensity: 1,
      Metalness: 0.5,
      Roughness: 0.5,
    },
    SkytubeShader: {
      Color: 0xff00ff,
      Intensity: 0.3,
      Fade: 0.65,
      Zoom: 1.3,
      StepSize: 0.25,
      Tile: 0.65,
      Transverse: 3,
    },
    Plaforms: {
      GenericMaterial: {
        Color: 0xffffff,
        Emissive: 0x0,
        EmissiveIntensity: 1,
        EnvMapIntensity: 1,
        Metalness: 0.5,
        Roughness: 0.5,
      },
      StaticLightMaterial: {
        Color: 0xffffff,
        Emissive: 0x0,
        EmissiveIntensity: 1,
      },
      MovingLightMaterial: {
        Color: 0xffffff,
        Emissive: 0x0,
        EmissiveIntensity: 1,
      },
    },
  },
};

export default DefaultMood;
