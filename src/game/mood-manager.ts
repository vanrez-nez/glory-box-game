import * as THREE from 'three/webgpu';
import gsap from 'gsap';
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
  opts!: Record<string, any>;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
  }

  resetToDefault() {
    this.transitionTo(DefaultMood, 0);
  }

  getPropertyType(prop: any) {
    let type;
    if (typeof prop === 'number') {
      type = 'Number';
    } else if (typeof prop === 'object') {
      type = prop.constructor.name;
    }
    return type;
  }

  materialPropEquals(prop: any, value: any) {
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

  getColorTween(target: any, time: any, propName: any, targetVal: any) {
    const targetColor = new THREE.Color(targetVal);
    return gsap.to(target[propName], {
      duration: time,
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
    });
  }

  getValueTween(target: any, time: any, propName: any, targetVal: any) {
    return gsap.to(target, {
      duration: time,
      [propName]: targetVal,
    });
  }

  getVectorTween(target: any, time: any, propName: any, targetVal: any) {
    const targetProps: Record<string, any> = { x: targetVal.x, y: targetVal.y };
    if (targetVal.w) {
      targetProps.w = targetVal.w;
    }
    if (targetVal.z) {
      targetProps.z = targetVal.z;
    }
    return gsap.to(target[propName], { duration: time, ...targetProps });
  }

  addPropertyTween(tl: any, target: any, time: any, propName: any, targetVal: any) {
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

  transitionEngine(presetNode: any, time: any) {
    const { bloomPass, scene, ambientLight, renderer } = this.opts.engine;
    const { BloomPass, Scene, AmbientLight, ToneMapping } = presetNode;
    const tl = gsap.timeline();
    if (BloomPass && bloomPass) {
      // BloomNode exposes strength/threshold/radius as TSL uniform nodes, so the
      // animated value lives on `.value` rather than directly on the pass.
      tl.to(bloomPass.strength, { duration: time, value: BloomPass.Strength }, 0);
      tl.to(bloomPass.threshold, { duration: time, value: BloomPass.Threshold }, 0);
      tl.to(bloomPass.radius, { duration: time, value: BloomPass.Radius }, 0);
    }
    tl.to(scene.fog, { duration: time, density: Scene.FogDensity }, 0);
    tl.to(ambientLight, { duration: time, intensity: AmbientLight.Intensity }, 0);
    tl.add(this.getColorTween(ambientLight, time, 'color', AmbientLight.Color), 0);
    tl.to(renderer, { duration: time, toneMappingExposure: ToneMapping.Exposure }, 0);
  }

  transitionDefaultMaterial(params: any) {
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

  transitionShaderMaterial(params: any) {
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

  transitionMaterialsGroup(tl: any, instances: any, config: any, time: any) {
    instances.forEach((instance: any) => {
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

  transitionMaterials(presetNode: any, time: any) {
    const tl = gsap.timeline();
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

  getQualityNode(presetNode: any) {
    const qualities = Object.keys(QUALITY);
    return presetNode[qualities[GameConfig.SceneQuality]];
  }

  async transitionTo(moodPreset: any, time: any) {
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
