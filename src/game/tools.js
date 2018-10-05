
import * as dat from 'dat.gui';
import { CONFIG } from './const';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

export default class GameTools {
  constructor() {
    this.gui = new dat.GUI({
      load: JSON,
    });
  }

  addScreen(screenName, obj) {
    switch (screenName) {
      case 'player':
        this.buildPlayerScreen(obj);
        break;
      case 'physics':
        this.buildPhysicsScreen(obj);
        break;
      case 'engine':
        this.buildEngineScreen(obj);
        break;
      case 'materials':
        this.buildMaterialsScreen();
        break;
    }
  }

  buildPhysicsScreen(obj) {
    const { gui } = this;
    const f1 = gui.addFolder('Generic Physics');
    gui.remember(obj.opts.gravity);
    f1.add(obj.opts.gravity, 'x', -0.5, 0.5).name('Gravity X');
    f1.add(obj.opts.gravity, 'y', -0.5, 0.5).name('Gravity Y');
  }

  buildPlayerScreen(obj) {
    const { gui } = this;
    const f1 = gui.addFolder('Player');

    gui.remember(obj.playerBody.opts);
    f1.add(obj.playerBody.opts, 'mass', 0.01, 0.3).name('Mass');
    f1.add(obj.playerBody.opts, 'friction', 0.01, 0.3).name('Friction');

    gui.remember(obj.playerBody.opts.maxVelocity);
    f1.add(obj.playerBody.opts.maxVelocity, 'x', 0.1, 2).name('Max Velocity X');
    f1.add(obj.playerBody.opts.maxVelocity, 'y', 0.1, 2).name('Max Velocity Y');

    gui.remember(obj.opts);
    f1.add(obj.opts, 'gravity', -1, -0.01).name('Ascend Gravity');
    f1.add(obj.opts, 'descentGravity', -1, -0.01).name('Descent Gravity');
    f1.add(obj.opts, 'walkForce', 0.01, 2).name('Walk Force');
    f1.add(obj.opts, 'jumpForce', 0.01, 2).name('Jump Force');
  }

  buildEngineScreen(obj) {
    const { gui } = this;
    const rootFolder = gui.addFolder('Engine');
    const { renderer, bloomPass, scene, ambientLight } = obj;
    const f0 = rootFolder.addFolder('Renderer');
    f0.add(renderer, 'toneMappingExposure', 0.0, 10);
    f0.add(renderer, 'toneMappingWhitePoint', 0.0, 10);
    f0.add(renderer, 'gammaFactor', 0.5, 5);
    if (CONFIG.UsePostProcessing) {
      // Bloom Pass
      const f1 = rootFolder.addFolder('BloomPass');
      gui.remember(obj.bloomPass);
      f1.add(bloomPass, 'strength', 0.5, 4.5).name('Strength');
      f1.add(bloomPass, 'radius', 0, 5).name(' Radius');
      f1.add(bloomPass, 'threshold', 0.1, 1.5).name(' Threshold');
      this.addColorField(f1, bloomPass.highPassUniforms.defaultColor, 'value', 'HighPass Color');
    }
    // Scene
    const f2 = rootFolder.addFolder('Scene');
    f2.add(scene.fog, 'density', 0, 0.025).name('Fog Density');
    this.addColorField(f2, scene.fog, 'color', 'Fog Color');
    // Ambient Light
    const f3 = rootFolder.addFolder('Ambient Light');
    f3.add(ambientLight, 'intensity', 0, 2).name('Intensity');
    this.addColorField(f3, ambientLight, 'color', 'Color');
  }

  addColorField(folder, obj, prop, name) {
    const proxy = { color: `#${obj[prop].getHexString()}` };
    const controller = folder.addColor(proxy, 'color').name(name);
    const color = obj[prop];
    controller.onChange((v) => {
      color.setHex(v.replace('#', '0x'));
    });
  }

  addMaterialFields(folder, mat) {
    const has = name => Object.prototype.hasOwnProperty.call(mat, name);
    has('color') && this.addColorField(folder, mat, 'color', 'Color');
    has('opacity') && folder.add(mat, 'opacity', 0, 1).name('Opacity');
    has('emissive') && this.addColorField(folder, mat, 'emissive', 'Emissive Color');
    has('emissiveIntensity') && folder.add(mat, 'emissiveIntensity', 0, 2).name('Emissive Int');
    has('reflectivity') && folder.add(mat, 'reflectivity', 0, 1).name('Reflectivity');
    has('shininess') && folder.add(mat, 'shininess', 0, 60).name('Shininess');
    has('refractionRatio') && folder.add(mat, 'refractionRatio', 0, 1).name('Refraction');
    has('specular') && this.addColorField(folder, mat, 'specular', 'Specular Color');
    has('envMapIntensity') && folder.add(mat, 'envMapIntensity', 0, 2).name('Env Map Int');
    has('metalness') && folder.add(mat, 'metalness', 0.0, 1).name('Metalness');
    has('roughness') && folder.add(mat, 'roughness', 0.0, 1).name('Roughness');
  }

  addMeshLineMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.color, 'value', 'Color');
    folder.add(u.lineWidth, 'value', 0.1, 10.0).name('Line Width');
  }

  addFireballShaderMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.fissuresColor, 'value', 'Fissures Color');
    folder.add(u.fissuresIntensity, 'value', 0, 10.0).name('Fissures Intensity');
    this.addColorField(folder, u.glowColor, 'value', 'Glow Color');
    folder.add(u.glowIntensity.value, 'x', 0.0, 10.0).name('Glow X (c)');
    folder.add(u.glowIntensity.value, 'y', 0.0, 10.0).name('Glow Y (p)');
    this.addColorField(folder, u.ringColor, 'value', 'Ring Color');
    folder.add(u.ringThickness, 'value', 0, 1.2).name('Ring Thickness');
  }

  addEnemyRayMaterial(folder, mat) {
    const u = mat.uniforms;
    const rayFolder = folder.addFolder('Ray');
    this.addColorField(rayFolder, u.rayColor, 'value', 'Ray Color');
    rayFolder.add(u.rayLevels.value, 'x', 0.0, 1.0).name('Inner Glow');
    rayFolder.add(u.rayLevels.value, 'y', 0.0, 1.0).name('Outer Glow');
    rayFolder.add(u.rayLevels.value, 'z', 0.0, 1.0).name('Intensity');
    rayFolder.add(u.rayLevels.value, 'w', 0.0, 1.0).name('Inner Fade');

    const d1Folder = folder.addFolder('Thin Debris');
    this.addColorField(d1Folder, u.thinDebrisColor, 'value', 'Color');
    d1Folder.add(u.thinDebrisLevels.value, 'x', 0.0, 1.0).name('Speed');
    d1Folder.add(u.thinDebrisLevels.value, 'y', 0.0, 1.0).name('Density');
    d1Folder.add(u.thinDebrisLevels.value, 'z', 0.0, 1.0).name('Width');
    d1Folder.add(u.thinDebrisLevels.value, 'w', 0.0, 1.0).name('Intensity');

    const d2Folder = folder.addFolder('Fat Debris');
    this.addColorField(d2Folder, u.fatDebrisColor, 'value', 'Color');
    d2Folder.add(u.fatDebrisLevels.value, 'x', 0.0, 1.0).name('Speed');
    d2Folder.add(u.fatDebrisLevels.value, 'y', 0.0, 1.0).name('Density');
    d2Folder.add(u.fatDebrisLevels.value, 'z', 0.0, 1.0).name('Width');
    d2Folder.add(u.fatDebrisLevels.value, 'w', 0.0, 1.0).name('Intensity');
  }

  addEnemyVortexMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.uColorFrom, 'value', 'Color From');
    this.addColorField(folder, u.uColorTo, 'value', 'Color To');
    folder.add(u.uTwist, 'value', 0, 4000).name('Twist');
    folder.add(u.uDisplacementScale, 'value', 0.0, 100.0).name('Disp Scale');
    folder.add(u.uDisplacementBias, 'value', 0.0, 100.0).name('Disp Bias');
    folder.add(u.uFogDistance, 'value', 0, 500).name('Fog Dist');
  }

  addSkyShaderMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.color, 'value', 'Color');
    folder.add(u.intensity, 'value', 0, 1).name('Intensity');
    folder.add(u.fade, 'value', 0, 2).name('Fade');
    folder.add(u.zoom, 'value', 0, 4).name('Zoom');
    folder.add(u.stepSize, 'value', 0, 1).name('Step Size');
    folder.add(u.tile, 'value', 0, 1).name('Tile');
    folder.add(u.transverseSpeed, 'value', 0, 4)
      .name('Transverse Speed');
  }

  getSkyShaderProps(mat) {
    const u = mat.uniforms;
    return {
      color: u.color.value,
      fade: u.fade.value,
      zoom: u.zoom.value,
      stepSize: u.stepSize.value,
      tile: u.tile.value,
      transverseSpeed: u.transverseSpeed.value,
    };
  }

  getFireballShaderProps(mat) {
    const u = mat.uniforms;
    return {
      fissuresColor: u.fissuresColor.value,
      fissuresIntensity: u.fissuresIntensity.value,
      glowColor: u.glowColor.value,
      glowIntensity: u.glowIntensity.value,
      ringColor: u.ringColor.value,
      ringThickness: u.ringThickness.value,
    };
  }

  getMeshLineProps(mat) {
    const u = mat.uniforms;
    return {
      color: u.color.value,
      lineWidth: u.lineWidth.value,
    };
  }

  getMeshEnemyRayProps(mat) {
    const u = mat.uniforms;
    return {
      rayColor: u.rayColor.value,
      thinDebrisColor: u.thinDebrisColor.value,
      fatDebrisColor: u.fatDebrisColor.value,
    };
  }

  getMaterialProps(mat) {
    const result = {};
    const exportedProps = [
      'color', 'emissive', 'emissiveIntensity', 'reflectivity',
      'specular', 'metalness', 'roughness', 'shininess',
    ];

    if (mat.transparent) {
      exportedProps.push('opacity');
    }

    if (mat.envMap) {
      exportedProps.push('envMapIntensity', 'refractionRatio', 'reflectivity');
    }
    exportedProps.forEach((p) => {
      if (mat[p]) {
        result[p] = mat[p];
      }
    });
    return result;
  }

  exportMaterialsNode(controller) {
    const result = {};
    const { instances } = MaterialFactory;
    instances.forEach((m) => {
      const mat = m.activeMaterial;
      const id = mat.userData.nodeId;
      const materialType = m.constructor.name;
      if (id && id !== '') {
        switch (materialType) {
          case 'WorldSkyCylinderMaterial':
            result[id] = this.getSkyShaderProps(mat);
            break;
          case 'PlayerHudFireballMaterial':
            result[id] = this.getFireballShaderProps(mat);
            break;
          case 'GenericTrailMaterial':
            result[id] = this.getMeshLineProps(mat);
            break;
          case 'EnemyRayMaterial':
            result[id] = this.getMeshEnemyRayProps(mat);
            break;
          default:
            result[id] = this.getMaterialProps(mat);
            break;
        }
      } else {
        // console.warn('Node Id not found for material:', m);
      }
    });
    controller.setValue(JSON.stringify(result));
  }

  buildMaterialsScreen() {
    const { gui } = this;
    const rootFolder = gui.addFolder('Materials');
    const matDict = MaterialFactory.getMaterialsByMaterialType();
    Object.keys(matDict).forEach((k) => {
      this.buildMaterialGroup(rootFolder, k, matDict[k]);
    });
    const exportOutput = { text: '' };
    const outputController = rootFolder.add(exportOutput, 'text').name('Output');
    const exportFunc = this.exportMaterialsNode.bind(this, outputController);
    rootFolder.add({ fn: exportFunc }, 'fn').name('Export Materials Node');
  }

  buildMaterialGroup(parentFolder, materialType, arr) {
    const rootFolder = parentFolder.addFolder(materialType);
    arr.forEach((m, idx) => {
      const label = m.opts.label || materialType;
      let subfolder = null;
      if (arr.length > 1) {
        subfolder = rootFolder.addFolder(`${label} (${idx})`);
      }
      const mat = m.activeMaterial;
      const f = subfolder || rootFolder;
      f.add({ t: mat.type }, 't').name('Type');
      switch (materialType) {
        case 'WorldSkyCylinderMaterial':
          this.addSkyShaderMaterial(f, mat);
          break;
        case 'PlayerHudFireballMaterial':
          this.addFireballShaderMaterial(f, mat);
          break;
        case 'GenericTrailMaterial':
          this.addMeshLineMaterial(f, mat);
          break;
        case 'EnemyVortexMaterial':
          this.addEnemyVortexMaterial(f, mat);
          break;
        case 'EnemyRayMaterial':
          this.addEnemyRayMaterial(f, mat);
          break;
        default:
          this.addMaterialFields(f, mat);
          break;
      }
    });
  }
}
