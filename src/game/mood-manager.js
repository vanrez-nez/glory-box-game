import { CONFIG, QUALITY } from './const';
import DefaultMood from './mood-presets/default';
// import NeutralMood from './mood-presets/neutral';
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
    let type;
    if (typeof prop === 'number') {
      type = 'Number';
    } else if (typeof prop === 'object') {
      type = prop.constructor.name;
    }
    return type;
  }

  materialPropEquals(prop, value) {
    const pType = this.getPropertyType(prop);
    switch (pType) {
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
    const targetProps = { x: targetVal.x, y: targetVal.y };
    if (targetVal.w) {
      targetProps.w = targetVal.w;
    }
    if (targetVal.z) {
      targetProps.z = targetVal.z;
    }
    return TweenMax.to(target[propName], time, targetProps);
  }

  addPropertyTween(tl, target, time, propName, targetVal) {
    const pType = this.getPropertyType(target[propName]);
    if (!this.materialPropEquals(target[propName], targetVal)) {
      switch (pType) {
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
    const { bloomPass, scene, ambientLight, renderer } = this.opts.engine;
    const qualities = Object.keys(QUALITY);
    const qualityNode = presetNode[qualities[CONFIG.SceneQuality]];
    const { BloomPass, Scene, AmbientLight, ToneMapping } = qualityNode;
    
    const tl = new TimelineMax();
    if (BloomPass && bloomPass) {
      tl.to(bloomPass, time, {
        strength: BloomPass.Strength,
        threshold: BloomPass.Threshold,
        radius: BloomPass.Radius,
      }, 0);
    }
    tl.to(scene.fog, time, { density: Scene.FogDensity }, 0);
    tl.to(ambientLight, time, { intensity: AmbientLight.Intensity }, 0);
    tl.add(this.getColorTween(ambientLight, time, 'color', AmbientLight.Color), 0);
    tl.to(renderer, time, { toneMappingExposure: ToneMapping.Exposure }, 0);
  }

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
        case 'WorldSkyCylinderMaterial':
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
    const qualities = Object.keys(QUALITY);
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
    this.transitionEngine(moodPreset.Engine, time);
    // this.transitionWorld(moodPreset.World, time);
    this.transitionMaterials(moodPreset.Materials, time);
  }
}
