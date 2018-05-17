import { CONFIG } from './const';
import DefaultMood from './mood-presets/default';
import NeutralMood from './mood-presets/neutral';

// import { LightMatStatic, LightMatMoving, GenericMat } from './platform';

const DEFAULT = {
  engine: null,
  word: null,
  map: null,
  initialMood: DefaultMood,
};

export default class GameMoodManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    // this.transitionTo(this.opts.initialMood, 0);
  }

  getColorTween(property, targetColor, time) {
    const colorTo = new THREE.Color(targetColor);
    return TweenMax.to(property, time, {
      r: colorTo.r,
      g: colorTo.g,
      b: colorTo.b,
    });
  }

  getMaterialTweens(material, targetProps, time) {
    return [
      this.getColorTween(material.color, targetProps.Color, time),
      this.getColorTween(material.emissive, targetProps.Emissive, time),
      new TweenMax(material, time, {
        emissiveIntensity: targetProps.EmissiveIntensity,
      }),
    ];
  }

  transitionEngine(presetNode, time) {
    const { bloomPass, scene, ambientLight } = this.opts.engine;
    const { BloomPass, Scene, AmbientLight } = presetNode;
    const tl = new TimelineMax();
    if (CONFIG.UsePostProcessing) {
      tl.to(bloomPass, time, {
        strength: BloomPass.Strength,
        threshold: BloomPass.Threshold,
        radius: BloomPass.Radius,
      }, 0);
      tl.add(this.getColorTween(bloomPass.highPassUniforms.defaultColor.value,
        BloomPass.HighPassColor, time));
    }
    tl.to(scene.fog, time, { density: Scene.FogDensity }, 0);
    tl.add(this.getColorTween(scene.fog.color, Scene.FogColor, time), 0);
    tl.to(ambientLight, time, { intensity: AmbientLight.Intensity }, 0);
    tl.add(this.getColorTween(ambientLight.color, AmbientLight.Color, time), 0);
  }

  transitionWorld(presetNode, time) {
    const { floor, skytube, cylinder } = this.opts.world;
    const { uniforms: stUniforms } = skytube.outterCylinder.material;
    const { FloorMaterial, CylinderMaterial, Skytube } = presetNode;
    const tl = new TimelineMax();
    tl.add(this.getMaterialTweens(floor.material, FloorMaterial, time));
    tl.add(this.getMaterialTweens(cylinder.material, CylinderMaterial, time));
    tl.add(this.getColorTween(stUniforms.color.value, Skytube.Color, time));
    tl.to(stUniforms.intensity, time, { value: Skytube.Intensity });
    tl.to(stUniforms.fade, time, { value: Skytube.Fade });
    tl.to(stUniforms.zoom, time, { value: Skytube.Zoom });
    tl.to(stUniforms.stepSize, time, { value: Skytube.StepSize });
    tl.to(stUniforms.tile, time, { value: Skytube.Tile });
    tl.to(stUniforms.transverseSpeed, time, { value: Skytube.Transverse });
  }

  transitionMap(presetNode, time) {
    // const { GenericMaterial, StaticLightMaterial, MovingLightMaterial } = presetNode.Platforms;
    // const tl = new TimelineMax();
    // tl.add(this.getMaterialTweens(GenericMat, GenericMaterial, time));
    // tl.add(this.getMaterialTweens(LightMatMoving, MovingLightMaterial, time));
    // tl.add(this.getMaterialTweens(LightMatStatic, StaticLightMaterial, time));
  }

  transitionTo(moodPreset, time) {
    this.transitionEngine(moodPreset.Engine, time);
    this.transitionWorld(moodPreset.World, time);
    this.transitionMap(moodPreset.Map, time);
  }
}
