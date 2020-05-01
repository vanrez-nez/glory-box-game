import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';
import * as dat from 'dat.gui';

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
    if (GameConfig.UsePostProcessing) {
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
    this.addColorField(folder, u.u_fissuresColor, 'value', 'Fissures Color');
    folder.add(u.u_fissuresIntensity, 'value', 0, 10.0).name('Fissures Intensity');
    this.addColorField(folder, u.u_glowColor, 'value', 'Glow Color');
    folder.add(u.u_glowIntensity.value, 'x', 0.0, 10.0).name('Glow X (c)');
    folder.add(u.u_glowIntensity.value, 'y', 0.0, 10.0).name('Glow Y (p)');
    this.addColorField(folder, u.u_ringColor, 'value', 'Ring Color');
    folder.add(u.u_ringThickness, 'value', 0, 1.2).name('Ring Thickness');
  }

  addEnemyRayMaterial(folder, mat) {
    const u = mat.uniforms;
    const rayFolder = folder.addFolder('Ray');
    this.addColorField(rayFolder, u.u_rayColor, 'value', 'Ray Color');
    rayFolder.add(u.u_rayLevels.value, 'x', 0.0, 1.0).name('Inner Glow');
    rayFolder.add(u.u_rayLevels.value, 'y', 0.0, 1.0).name('Outer Glow');
    rayFolder.add(u.u_rayLevels.value, 'z', 0.0, 1.0).name('Intensity');
    rayFolder.add(u.u_rayLevels.value, 'w', 0.0, 1.0).name('Inner Fade');

    const d1Folder = folder.addFolder('Thin Debris');
    this.addColorField(d1Folder, u.u_thinDebrisColor, 'value', 'Color');
    d1Folder.add(u.u_thinDebrisLevels.value, 'x', 0.0, 1.0).name('Speed');
    d1Folder.add(u.u_thinDebrisLevels.value, 'y', 0.0, 1.0).name('Density');
    d1Folder.add(u.u_thinDebrisLevels.value, 'z', 0.0, 1.0).name('Width');
    d1Folder.add(u.u_thinDebrisLevels.value, 'w', 0.0, 1.0).name('Intensity');

    const d2Folder = folder.addFolder('Fat Debris');
    this.addColorField(d2Folder, u.u_fatDebrisColor, 'value', 'Color');
    d2Folder.add(u.u_fatDebrisLevels.value, 'x', 0.0, 1.0).name('Speed');
    d2Folder.add(u.u_fatDebrisLevels.value, 'y', 0.0, 1.0).name('Density');
    d2Folder.add(u.u_fatDebrisLevels.value, 'z', 0.0, 1.0).name('Width');
    d2Folder.add(u.u_fatDebrisLevels.value, 'w', 0.0, 1.0).name('Intensity');
  }

  addEnemyVortexMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.u_colorFrom, 'value', 'Color From');
    this.addColorField(folder, u.u_colorTo, 'value', 'Color To');
    folder.add(u.u_twist, 'value', 0, 4000).name('Twist');
    folder.add(u.u_displacementScale, 'value', 0.0, 100.0).name('Disp Scale');
    folder.add(u.u_displacementBias, 'value', 0.0, 100.0).name('Disp Bias');
    folder.add(u.u_fogDistance, 'value', 0, 500).name('Fog Dist');
  }

  addSkyShaderMaterial(folder, mat) {
    const u = mat.uniforms;
    this.addColorField(folder, u.u_color, 'value', 'Color');
    folder.add(u.u_intensity, 'value', 0, 1).name('Intensity');
    folder.add(u.u_fade, 'value', 0, 2).name('Fade');
    folder.add(u.u_zoom, 'value', 0, 4).name('Zoom');
    folder.add(u.u_stepSize, 'value', 0, 1).name('Step Size');
    folder.add(u.u_tile, 'value', 0, 1).name('Tile');
    folder.add(u.u_transverseSpeed, 'value', 0, 4)
      .name('Transverse Speed');
  }

  getSkyShaderProps(mat) {
    const u = mat.uniforms;
    return {
      u_color: u.u_color.value,
      u_fade: u.u_fade.value,
      u_zoom: u.u_zoom.value,
      u_stepSize: u.u_stepSize.value,
      u_tile: u.u_tile.value,
      u_transverseSpeed: u.u_transverseSpeed.value,
    };
  }

  getFireballShaderProps(mat) {
    const u = mat.uniforms;
    return {
      u_fissuresColor: u.u_fissuresColor.value,
      u_fissuresIntensity: u.u_fissuresIntensity.value,
      u_glowColor: u.u_glowColor.value,
      u_glowIntensity: u.u_glowIntensity.value,
      u_ringColor: u.u_ringColor.value,
      u_ringThickness: u.u_ringThickness.value,
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
      u_rayColor: u.u_rayColor.value,
      u_thinDebrisColor: u.u_thinDebrisColor.value,
      u_fatDebrisColor: u.u_fatDebrisColor.value,
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
