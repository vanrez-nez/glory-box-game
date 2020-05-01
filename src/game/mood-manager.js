import { QUALITY } from '@/game/const';
import DefaultMood from '@/game/mood-presets/default';
// import NeutralMood from '@/game/mood-presets/neutral';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';


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
    const { BloomPass, Scene, AmbientLight, ToneMapping } = presetNode;
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
      } else {
        console.error('Property:', propName, 'doesn\'t exists on', target);
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

  transitionMaterials(presetNode, time) {
    const tl = new TimelineMax();
    const matDict = MaterialFactory.getMaterialsByNodeName();
    const keys = Object.keys(presetNode);
    keys.forEach((key) => {
      const matConfig = presetNode[key];
      const instances = matDict[key];
      if (matConfig && instances) {
        this.transitionMaterialsGroup(tl, instances, matConfig, time);
      }
    });
  }

  getQualityNode(presetNode) {
    const qualities = Object.keys(QUALITY);
    return presetNode[qualities[GameConfig.SceneQuality]];
  }

  async transitionTo(moodPreset, time) {
    const engineNode = this.getQualityNode(moodPreset.Engine);
    const materialsNode = this.getQualityNode(moodPreset.Materials);
    this.transitionEngine(engineNode, time);
    // this.transitionWorld(moodPreset.World, time);
    this.transitionMaterials(materialsNode, time);
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
}
