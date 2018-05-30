import { CONFIG } from './const';
import DefaultMood from './mood-presets/default';
import NeutralMood from './mood-presets/neutral';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  engine: null,
  word: null,
  map: null,
  initialMood: DefaultMood,
};

export default class GameMoodManager {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
  }

  resetToDefault() {
    this.transitionTo(DefaultMood, 0);
  }

  getPropertyType(prop) {
    return {
      isNumber: typeof prop === 'number',
      isColor: typeof prop === 'object' && prop.isColor,
    };
  }

  materialPropEquals(prop, value) {
    const pType = this.getPropertyType(prop);
    if (pType.isNumber) {
      return prop === value;
    } else if (pType.isColor) {
      return prop.getHex() === value;
    } else {
      return false;
    }
  }

  getColorTween(target, time, propName, targetVal) {
    const targetColor = new THREE.Color(targetVal);
    return TweenMax.to(target[propName], time, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
    });
  }

  getValueTween(target, time, propName, targetVal) {
    return TweenMax.to(target, time, {
      [propName]: targetVal,
    });
  }

  addPropertyTween(tl, target, time, propName, targetVal) {
    const propType = this.getPropertyType(target[propName]);
    if (!this.materialPropEquals(target[propName], targetVal)) {
      if (propType.isColor) {
        tl.add(this.getColorTween(target, time, propName, targetVal));
      } else if (propType.isNumber) {
        tl.add(this.getValueTween(target, time, propName, targetVal));
      }
    }
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
      // tl.add(this.getColorTween(bloomPass.highPassUniforms.defaultColor.value,
      //   BloomPass.HighPassColor, time));
    }
    tl.to(scene.fog, time, { density: Scene.FogDensity }, 0);
    // tl.add(this.getColorTween(scene.fog.color, Scene.FogColor, time), 0);
    tl.to(ambientLight, time, { intensity: AmbientLight.Intensity }, 0);
    // tl.add(this.getColorTween(ambientLight.color, AmbientLight.Color, time), 0);
  }

  // transitionWorld(presetNode, time) {
  //   const { floor, skytube, cylinder } = this.opts.world;
  //   const { uniforms: stUniforms } = skytube.outterCylinder.material;
  //   const { FloorMaterial, CylinderMaterial, Skytube } = presetNode;
  //   const tl = new TimelineMax();
  //   tl.add(this.getMaterialTweens(floor.material, FloorMaterial, time));
  //   tl.add(this.getMaterialTweens(cylinder.material, CylinderMaterial, time));
  //   tl.add(this.getColorTween(stUniforms.color.value, Skytube.Color, time));
  //   tl.to(stUniforms.intensity, time, { value: Skytube.Intensity });
  //   tl.to(stUniforms.fade, time, { value: Skytube.Fade });
  //   tl.to(stUniforms.zoom, time, { value: Skytube.Zoom });
  //   tl.to(stUniforms.stepSize, time, { value: Skytube.StepSize });
  //   tl.to(stUniforms.tile, time, { value: Skytube.Tile });
  //   tl.to(stUniforms.transverseSpeed, time, { value: Skytube.Transverse });
  // }

  transitionMaterialsGroup(tl, instances, config, time) {
    const propNames = Object.keys(config);
    instances.forEach((instance) => {
      const mat = instance.activeMaterial;
      propNames.forEach((propName) => {
        const targetValue = config[propName];
        const matProp = mat[propName];
        if (matProp) {
          this.addPropertyTween(tl, mat, time, propName, targetValue);
        }
      });
    });
  }

  transitionMaterials(materialsNode, time) {
    const tl = new TimelineMax();
    const qualities = ['Low', 'Medium', 'High'];
    const qualityNode = materialsNode[qualities[CONFIG.MaterialQuality]];
    const matDict = MaterialFactory.getMaterialsByNodeName();
    const keys = Object.keys(qualityNode);
    keys.forEach((key) => {
      const matConfig = qualityNode[key];
      const instances = matDict[key];
      if (matConfig && instances) {
        this.transitionMaterialsGroup(tl, instances, matConfig, time);
      }
    });
  }

  transitionTo(moodPreset, time) {
    // this.transitionEngine(moodPreset.Engine, time);
    // this.transitionWorld(moodPreset.World, time);
    this.transitionMaterials(moodPreset.Materials, time);
  }
}
