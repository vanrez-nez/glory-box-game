import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { Pane } from 'tweakpane';
import { StatsPanePluginBundle, type StatsPaneApi } from '@/game/stats-blade';

export default class GameTools {
  pane!: any;
  tab?: any;
  pages: Record<string, any> = {};
  fpsGraph?: StatsPaneApi;
  constructor() {
    this.pane = new Pane({ title: 'Dev Tools' });
    this.pane.registerPlugin(StatsPanePluginBundle);
    // Widen the floating pane wrapper (default ~256px) to 30rem.
    const wrapper = this.pane.element.parentElement as HTMLElement | null;
    if (wrapper) { wrapper.style.width = '30rem'; }
    this.pane.element.style.width = '30rem';
  }

  // Lazily create the tabbed layout the screens build into (Physics / Engine /
  // Player / Materials). Created on first use so it sits below the FPS blade.
  ensureTabs() {
    if (this.tab) { return; }
    this.tab = this.pane.addTab({
      pages: [
        { title: 'Physics' },
        { title: 'Engine' },
        { title: 'Player' },
        { title: 'Materials' },
      ],
    });
    this.pages = {
      physics: this.tab.pages[0],
      engine: this.tab.pages[1],
      player: this.tab.pages[2],
      materials: this.tab.pages[3],
    };
  }

  addFpsGraph() {
    this.fpsGraph = this.pane.addBlade({ view: 'stats', label: 'FPS' }) as unknown as StatsPaneApi;
    return this.fpsGraph;
  }

  addScreen(screenName: any, obj?: any) {
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

  /*
    Persists the whole pane state to localStorage so dev tweaks survive reloads
    (a lightweight replacement for dat.gui's named-preset "remember" system).
    Also adds a Reset button to clear the saved state.
  */
  persist() {
    const key = 'glory-box:tools-state';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.pane.importState(JSON.parse(saved));
      } catch {
        localStorage.removeItem(key);
      }
    }
    this.pane.on('change', () => {
      localStorage.setItem(key, JSON.stringify(this.pane.exportState()));
    });
    this.pane.addButton({ title: 'Reset Tweaks' }).on('click', () => {
      localStorage.removeItem(key);
      window.location.reload();
    });
  }

  buildPhysicsScreen(obj: any) {
    this.ensureTabs();
    const f1 = this.pages.physics;
    f1.addBinding(obj.opts.gravity, 'x', { min: -0.5, max: 0.5, label: 'Gravity X' });
    f1.addBinding(obj.opts.gravity, 'y', { min: -0.5, max: 0.5, label: 'Gravity Y' });
  }

  buildPlayerScreen(obj: any) {
    this.ensureTabs();
    const f1 = this.pages.player;

    f1.addBinding(obj.playerBody.opts, 'mass', { min: 0.01, max: 0.3, label: 'Mass' });
    f1.addBinding(obj.playerBody.opts, 'friction', { min: 0.01, max: 0.3, label: 'Friction' });

    f1.addBinding(obj.playerBody.opts.maxVelocity, 'x', { min: 0.1, max: 2, label: 'Max Velocity X' });
    f1.addBinding(obj.playerBody.opts.maxVelocity, 'y', { min: 0.1, max: 2, label: 'Max Velocity Y' });

    f1.addBinding(obj.opts, 'gravity', { min: -1, max: -0.01, label: 'Ascend Gravity' });
    f1.addBinding(obj.opts, 'descentGravity', { min: -1, max: -0.01, label: 'Descent Gravity' });
    f1.addBinding(obj.opts, 'walkForce', { min: 0.01, max: 2, label: 'Walk Force' });
    f1.addBinding(obj.opts, 'jumpForce', { min: 0.01, max: 2, label: 'Jump Force' });
  }

  buildEngineScreen(obj: any) {
    this.ensureTabs();
    const rootFolder = this.pages.engine;
    const { renderer, bloomPass, scene, ambientLight } = obj;
    const f0 = rootFolder.addFolder({ title: 'Renderer' });
    f0.addBinding(renderer, 'toneMappingExposure', { min: 0.0, max: 10 });
    if (GameConfig.UsePostProcessing) {
      // Bloom Pass — BloomNode exposes its params as TSL uniform nodes, so the
      // tweakpane bindings target the `.value` of each uniform.
      const f1 = rootFolder.addFolder({ title: 'BloomPass' });
      f1.addBinding(bloomPass.strength, 'value', { min: 0.5, max: 4.5, label: 'Strength' });
      f1.addBinding(bloomPass.radius, 'value', { min: 0, max: 5, label: 'Radius' });
      f1.addBinding(bloomPass.threshold, 'value', { min: 0.1, max: 1.5, label: 'Threshold' });
    }
    // Scene
    const f2 = rootFolder.addFolder({ title: 'Scene' });
    f2.addBinding(scene.fog, 'density', { min: 0, max: 0.025, label: 'Fog Density' });
    this.addColorField(f2, scene.fog, 'color', 'Fog Color');
    // Ambient Light
    const f3 = rootFolder.addFolder({ title: 'Ambient Light' });
    f3.addBinding(ambientLight, 'intensity', { min: 0, max: 2, label: 'Intensity' });
    this.addColorField(f3, ambientLight, 'color', 'Color');
  }

  /*
    Binds a THREE.Color directly: Tweakpane detects the {r,g,b} shape and
    mutates the channels in place (it does not replace the object), so the
    THREE.Color instance and its methods are preserved. With ColorManagement
    disabled (see src/three-setup.ts) the channels are raw 0-1 sRGB values, so
    the `float` picker maps the same way the old hex proxy did.
  */
  addColorField(folder: any, obj: any, prop: any, name: any) {
    folder.addBinding(obj, prop, { label: name, color: { type: 'float' } });
  }

  addMaterialFields(folder: any, mat: any) {
    const has = (name: any) => Object.prototype.hasOwnProperty.call(mat, name);
    has('color') && this.addColorField(folder, mat, 'color', 'Color');
    has('opacity') && folder.addBinding(mat, 'opacity', { min: 0, max: 1, label: 'Opacity' });
    has('emissive') && this.addColorField(folder, mat, 'emissive', 'Emissive Color');
    has('emissiveIntensity') && folder.addBinding(mat, 'emissiveIntensity', { min: 0, max: 2, label: 'Emissive Int' });
    has('reflectivity') && folder.addBinding(mat, 'reflectivity', { min: 0, max: 1, label: 'Reflectivity' });
    has('shininess') && folder.addBinding(mat, 'shininess', { min: 0, max: 60, label: 'Shininess' });
    has('refractionRatio') && folder.addBinding(mat, 'refractionRatio', { min: 0, max: 1, label: 'Refraction' });
    has('specular') && this.addColorField(folder, mat, 'specular', 'Specular Color');
    has('envMapIntensity') && folder.addBinding(mat, 'envMapIntensity', { min: 0, max: 2, label: 'Env Map Int' });
    has('metalness') && folder.addBinding(mat, 'metalness', { min: 0.0, max: 1, label: 'Metalness' });
    has('roughness') && folder.addBinding(mat, 'roughness', { min: 0.0, max: 1, label: 'Roughness' });
  }

  addMeshLineMaterial(folder: any, mat: any) {
    const u = mat.uniforms;
    this.addColorField(folder, u.color, 'value', 'Color');
    folder.addBinding(u.lineWidth, 'value', { min: 0.1, max: 10.0, label: 'Line Width' });
  }

  addFireballShaderMaterial(folder: any, mat: any) {
    const u = mat.uniforms;
    this.addColorField(folder, u.u_fissuresColor, 'value', 'Fissures Color');
    folder.addBinding(u.u_fissuresIntensity, 'value', { min: 0, max: 10.0, label: 'Fissures Intensity' });
    this.addColorField(folder, u.u_glowColor, 'value', 'Glow Color');
    folder.addBinding(u.u_glowIntensity.value, 'x', { min: 0.0, max: 10.0, label: 'Glow X (c)' });
    folder.addBinding(u.u_glowIntensity.value, 'y', { min: 0.0, max: 10.0, label: 'Glow Y (p)' });
    this.addColorField(folder, u.u_ringColor, 'value', 'Ring Color');
    folder.addBinding(u.u_ringThickness, 'value', { min: 0, max: 1.2, label: 'Ring Thickness' });
  }

  addEnemyRayMaterial(folder: any, mat: any) {
    const u = mat.uniforms;
    const rayFolder = folder.addFolder({ title: 'Ray' });
    this.addColorField(rayFolder, u.u_rayColor, 'value', 'Ray Color');
    rayFolder.addBinding(u.u_rayLevels.value, 'x', { min: 0.0, max: 1.0, label: 'Inner Glow' });
    rayFolder.addBinding(u.u_rayLevels.value, 'y', { min: 0.0, max: 1.0, label: 'Outer Glow' });
    rayFolder.addBinding(u.u_rayLevels.value, 'z', { min: 0.0, max: 1.0, label: 'Intensity' });
    rayFolder.addBinding(u.u_rayLevels.value, 'w', { min: 0.0, max: 1.0, label: 'Inner Fade' });

    const d1Folder = folder.addFolder({ title: 'Thin Debris' });
    this.addColorField(d1Folder, u.u_thinDebrisColor, 'value', 'Color');
    d1Folder.addBinding(u.u_thinDebrisLevels.value, 'x', { min: 0.0, max: 1.0, label: 'Speed' });
    d1Folder.addBinding(u.u_thinDebrisLevels.value, 'y', { min: 0.0, max: 1.0, label: 'Density' });
    d1Folder.addBinding(u.u_thinDebrisLevels.value, 'z', { min: 0.0, max: 1.0, label: 'Width' });
    d1Folder.addBinding(u.u_thinDebrisLevels.value, 'w', { min: 0.0, max: 1.0, label: 'Intensity' });

    const d2Folder = folder.addFolder({ title: 'Fat Debris' });
    this.addColorField(d2Folder, u.u_fatDebrisColor, 'value', 'Color');
    d2Folder.addBinding(u.u_fatDebrisLevels.value, 'x', { min: 0.0, max: 1.0, label: 'Speed' });
    d2Folder.addBinding(u.u_fatDebrisLevels.value, 'y', { min: 0.0, max: 1.0, label: 'Density' });
    d2Folder.addBinding(u.u_fatDebrisLevels.value, 'z', { min: 0.0, max: 1.0, label: 'Width' });
    d2Folder.addBinding(u.u_fatDebrisLevels.value, 'w', { min: 0.0, max: 1.0, label: 'Intensity' });
  }

  addSkyShaderMaterial(folder: any, mat: any) {
    const u = mat.uniforms;
    this.addColorField(folder, u.u_color, 'value', 'Color');
    folder.addBinding(u.u_intensity, 'value', { min: 0, max: 1, label: 'Intensity' });
    folder.addBinding(u.u_fade, 'value', { min: 0, max: 2, label: 'Fade' });
    folder.addBinding(u.u_zoom, 'value', { min: 0, max: 4, label: 'Zoom' });
    folder.addBinding(u.u_stepSize, 'value', { min: 0, max: 1, label: 'Step Size' });
    folder.addBinding(u.u_tile, 'value', { min: 0, max: 1, label: 'Tile' });
    folder.addBinding(u.u_transverseSpeed, 'value', { min: 0, max: 4, label: 'Transverse Speed' });
  }

  getSkyShaderProps(mat: any) {
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

  getFireballShaderProps(mat: any) {
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

  getMeshLineProps(mat: any) {
    const u = mat.uniforms;
    return {
      color: u.color.value,
      lineWidth: u.lineWidth.value,
    };
  }

  getMeshEnemyRayProps(mat: any) {
    const u = mat.uniforms;
    return {
      u_rayColor: u.u_rayColor.value,
      u_thinDebrisColor: u.u_thinDebrisColor.value,
      u_fatDebrisColor: u.u_fatDebrisColor.value,
    };
  }

  getMaterialProps(mat: any) {
    const result: Record<string, any> = {};
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

  exportMaterialsNode(exportOutput: any) {
    const result: Record<string, any> = {};
    const { instances } = MaterialFactory;
    instances.forEach((m) => {
      const mat = m.activeMaterial;
      const id = mat.userData.nodeId;
      const materialType = m.materialType;
      if (id && id !== '') {
        switch (materialType) {
          case 'WorldSkyCylinder':
            result[id] = this.getSkyShaderProps(mat);
            break;
          case 'PlayerHudFireball':
            result[id] = this.getFireballShaderProps(mat);
            break;
          case 'EnemyRay':
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
    exportOutput.text = JSON.stringify(result);
    this.pane.refresh();
  }

  buildMaterialsScreen() {
    this.ensureTabs();
    const rootFolder = this.pages.materials;
    const matDict = MaterialFactory.getMaterialsByMaterialType();
    Object.keys(matDict).forEach((k) => {
      this.buildMaterialGroup(rootFolder, k, matDict[k]);
    });
    const exportOutput = { text: '' };
    rootFolder.addBinding(exportOutput, 'text', { label: 'Output' });
    const exportFunc = this.exportMaterialsNode.bind(this, exportOutput);
    rootFolder.addButton({ title: 'Export Materials Node' }).on('click', exportFunc);
  }

  buildMaterialGroup(parentFolder: any, materialType: any, arr: any) {
    const rootFolder = parentFolder.addFolder({ title: materialType, expanded: false });
    arr.forEach((m: any, idx: any) => {
      const label = m.opts.label || materialType;
      let subfolder = null;
      if (arr.length > 1) {
        subfolder = rootFolder.addFolder({ title: `${label} (${idx})`, expanded: false });
      }
      const mat = m.activeMaterial;
      const f = subfolder || rootFolder;
      // `interval: 0` → ManualTicker, so this readonly (monitor) binding is read
      // once instead of polling every 200ms. Without it, each material's Type
      // label spins an IntervalTicker that re-reads on a fresh buffer every tick
      // and emits `change` continuously (≈20 of them ≈ a timer every ~10ms).
      f.addBinding({ t: mat.type }, 't', { label: 'Type', readonly: true, interval: 0 });
      switch (materialType) {
        case 'WorldSkyCylinder':
          this.addSkyShaderMaterial(f, mat);
          break;
        case 'PlayerHudFireball':
          this.addFireballShaderMaterial(f, mat);
          break;
        case 'EnemyRay':
          this.addEnemyRayMaterial(f, mat);
          break;
        default:
          this.addMaterialFields(f, mat);
          break;
      }
    });
  }
}
