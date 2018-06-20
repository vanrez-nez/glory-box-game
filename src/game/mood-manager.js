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
    if (typeof prop === 'number') {
      return 'Number';
    } else if (typeof prop === 'object') {
      return prop.constructor.name;
    }
  }

  materialPropEquals(prop, value) {
    const pType = this.getPropertyType(prop);
    switch(pType) {  
      case 'Color':
        return prop.getHex() === value;
      case 'Vector2':
      case 'Vector3':
      case 'Vector4':
        return prop.equals(value);
      default:
        return prop === value;
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

  getVectorTween(target, time, propName, targetVal) {
    let targetProps = { x: targetVal.x, y: targetVal.y };
    if (targetVal.w) {
      targetProps.w = targetVal.w;
    }
    if (targetVal.z) {
      targetProps.z = targetVal.z
    }
    return TweenMax.to(target[propName], time, targetProps);
  }

  addPropertyTween(tl, target, time, propName, targetVal) {
    const pType = this.getPropertyType(target[propName]);
    if (!this.materialPropEquals(target[propName], targetVal)) {
      switch(pType) {
        case 'Color':
          tl.add(this.getColorTween(target, time, propName, targetVal));
          break;
        case 'Vector2':
        case 'Vector3':
        case 'Vector4':
          tl.add(this.getVectorTween(target, time, propName, targetVal));
          break;
        case 'Number':
          tl.add(this.getValueTween(target, time, propName, targetVal));
          break;
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

  transitionDefaultMaterial(params) {
    const { tl, mat, time, config } = params;
    const propNames = Object.keys(config);
    propNames.forEach((propName) => {
      const targetValue = config[propName];
      const matProp = mat[propName];
      if (matProp) {
        this.addPropertyTween(tl, mat, time, propName, targetValue);
      }
    });
  }

  transitionShaderMaterial(params) {
    const { tl, mat, time, config } = params;
    const propNames = Object.keys(config);
    const target = mat.uniforms;
    propNames.forEach((propName) => {
      const targetValue = config[propName];
      if (target[propName]) {
        this.addPropertyTween(tl, target[propName], time, 'value', targetValue);
      }
    });
  }

  transitionMaterialsGroup(tl, instances, config, time) {
    instances.forEach((instance) => {
      const mat = instance.activeMaterial;
      const type = instance.constructor.name;
      const tntParams = { tl, mat, time, config };
      switch (type) {
        case 'EnemyRayMaterial':
        case 'PlayerHudFireballMaterial':
        case 'GenericTrailMaterial':
          this.transitionShaderMaterial(tntParams);
          break;
        default:
          this.transitionDefaultMaterial(tntParams);
          break; 
      }
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
