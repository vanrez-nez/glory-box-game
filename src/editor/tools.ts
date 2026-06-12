import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { COLLECTIBLE } from '@/game/const';
import { Pane } from 'tweakpane';
import { StatsPanePluginBundle, type StatsPaneApi } from '@/editor/stats-blade';
import { ITEM_TYPES, ITEM_CATALOG } from '@/editor/items';
import type { EditorState, ItemType } from '@/editor/store';

// Bump whenever the dev-pane structure changes (tabs/bindings added or removed)
// so a stale persisted state is dropped instead of corrupting the new layout.
const TOOLS_STATE_VERSION = 7;

const DEN_DIRECTIONS = { input: 'input', output: 'output', both: 'both' };

// Which tab each material (by registry key) is filed under. Only Player* and
// Enemy* are routed; everything else (world / platforms / collectibles / sockets
// / generic / fx) falls back to 'world'. Engine has no materials. Enemy* are the
// dragon's materials (filed under Dragon, displayed as Dragon*).
const MATERIAL_TAB: Record<string, string> = {
  PlayerMaterial: 'player',
  PlayerHitFx: 'player',
  PlayerHudFireball: 'player',
  EnemyHead: 'dragon',
  EnemyArmor: 'dragon',
  EnemyEyes: 'dragon',
  EnemyRay: 'dragon',
};

export default class GameTools {
  pane!: any;
  tab?: any;
  pages: Record<string, any> = {};
  fpsGraph?: StatsPaneApi;
  // Per-item placement folders in the Editor tab (toggled by selection/insert).
  editorFolders: Partial<Record<ItemType, any>> = {};
  constructor() {
    this.pane = new Pane({ title: 'Dev Tools' });
    this.pane.registerPlugin(StatsPanePluginBundle);
    // Widen the floating pane wrapper (default ~256px) to 30rem.
    const wrapper = this.pane.element.parentElement as HTMLElement | null;
    if (wrapper) {
      wrapper.style.width = '30rem';
      // Cap the floating wrapper to the viewport (it sits 8px from the top) and
      // let it scroll internally. Otherwise a tall pane overflows the viewport
      // and drags the whole page/game into scrolling instead of the pane.
      wrapper.style.maxHeight = 'calc(100vh - 16px)';
      wrapper.style.overflowY = 'auto';
    }
    this.pane.element.style.width = '30rem';
  }

  // Lazily create the tabbed layout the screens build into (Physics / Engine /
  // Player / Materials). Created on first use so it sits below the FPS blade.
  ensureTabs() {
    if (this.tab) { return; }
    this.tab = this.pane.addTab({
      pages: [
        { title: 'Engine' },
        { title: 'Player' },
        { title: 'Dragon' },
        { title: 'World' },
        { title: 'Editor' },
      ],
    });
    this.pages = {
      engine: this.tab.pages[0],
      player: this.tab.pages[1],
      dragon: this.tab.pages[2],
      world: this.tab.pages[3],
      editor: this.tab.pages[4],
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
      case 'dragon':
        this.buildDragonScreen(obj);
        break;
      case 'world':
        this.buildWorldScreen(obj);
        break;
      case 'editor':
        this.buildEditorScreen(obj);
        break;
    }
  }

  // Editor tab: cylinder/grid controls, the per-item placement folders (bound to
  // the placement controller's editable insert metadata), and level export/import.
  // `obj` = { mainCylinder, hexGrid, overlay, placement, actions }.
  buildEditorScreen(obj: any) {
    this.ensureTabs();
    const f = this.pages.editor;
    f.addBinding(obj.mainCylinder.group, 'visible', { label: 'Cylinder Visible' });
    // Grid auto-shows in edit mode; this is a manual gate within edit mode.
    f.addBinding(obj.overlay, 'enabled', { label: 'Grid Visible' });
    // Resizing the grid re-derives every placed component from its cell record.
    f.addBinding(obj.hexGrid.params, 'columns', {
      min: 3, max: 64, step: 1, label: 'Hex Columns',
    }).on('change', () => obj.actions.onColumnsChanged());
    // Global inner padding (cells, per side) — shrinks all pads + their sockets.
    f.addBinding(obj.settings, 'padding', {
      min: 0, max: 0.45, step: 0.01, label: 'Pad Padding',
    }).on('change', () => obj.actions.setPadding(obj.settings.padding));

    const { placement, actions } = obj;
    for (const type of ITEM_TYPES) {
      const meta = placement.insertMeta[type];
      const folder = f.addFolder({ title: ITEM_CATALOG[type].label, expanded: true, hidden: true });
      if (type === 'staticPad' || type === 'movingPad') {
        folder.addBinding(meta, 'width', { min: 1, max: 8, step: 1, label: 'Track (cells)' });
        if (type === 'movingPad') {
          folder.addBinding(meta, 'padPercent', { min: 0.1, max: 1, step: 0.05, label: 'Pad %' });
        }
      } else if (type === 'collectible') {
        folder.addBinding(meta, 'glyph', { options: COLLECTIBLE, label: 'Glyph' });
      } else if (type === 'den') {
        folder.addBinding(meta, 'direction', { options: DEN_DIRECTIONS, label: 'Direction' });
      }
      folder.on('change', () => placement.applyMeta(type));
      this.editorFolders[type] = folder;
    }

    const level = f.addFolder({ title: 'Level', expanded: false });
    level.addButton({ title: 'Export JSON' }).on('click', actions.downloadLevel);
    level.addButton({ title: 'Import JSON' }).on('click', () => this.pickLevelFile(actions.importLevel));
    level.addButton({ title: 'Clear All' }).on('click', actions.clearLevel);
  }

  // Hidden file input → read the chosen JSON → hand the text to the import action.
  pickLevelFile(onText: (json: string) => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { return; }
      file.text().then(onText);
    };
    input.click();
  }

  // Show the folder matching the inserted type (insert) or the selected item's
  // type (select); hide the rest.
  updateEditorFolders(state: EditorState) {
    const relevant: ItemType | null = state.mode === 'insert'
      ? state.insertType
      : (state.selectedId ? state.records[state.selectedId]?.type ?? null : null);
    for (const type of ITEM_TYPES) {
      const folder = this.editorFolders[type];
      if (folder) { folder.hidden = (type !== relevant); }
    }
  }

  // World tab hosts the world/terrain materials (added by buildMaterials). The
  // cylinder/grid controls live in the Editor tab (buildEditorScreen).
  buildWorldScreen(_obj: any) {
    this.ensureTabs();
  }

  // Live-tune the dragon movement/pose (binds to the dragon's mutable `params`).
  buildDragonScreen(obj: any) {
    this.ensureTabs();
    const f = this.pages.dragon;
    const p = obj.params;
    f.addBinding(p, 'speed', { min: 5, max: 60, label: 'Speed' });
    f.addBinding(p, 'amplitude', { min: 0, max: 12, label: 'Undulation Amp' });
    f.addBinding(p, 'wavelength', { min: 4, max: 40, label: 'Wavelength' });
    f.addBinding(p, 'waveSpeed', { min: 0, max: 10, label: 'Wave Speed' });
    f.addBinding(p, 'bodyLength', { min: 10, max: 80, label: 'Body Length' });
    f.addBinding(p, 'circleHeight', { min: 0, max: 15, label: 'Circle Height' });
    f.addBinding(p, 'bodySep', { min: 0, max: 15, label: 'Attack Body Sep' });
    f.addBinding(p, 'headDist', { min: -5, max: 8, label: 'Attack Head Dist' });
    f.addBinding(p, 'bendLength', { min: 1, max: 60, step: 1, label: 'Attack Bend Len' });
    f.addBinding(p, 'hiddenDwell', { min: 0, max: 10, label: 'Hidden Dwell' });
    f.addBinding(p, 'activeDuration', { min: 1, max: 15, label: 'Active Duration' });
    f.addBinding(p, 'emergeTime', { min: 0.2, max: 3, label: 'Emerge Time' });
    f.addBinding(p, 'diveTime', { min: 0.2, max: 3, label: 'Dive Time' });
    f.addBinding(p, 'attackWeight', { min: 0, max: 1, label: 'Attack Weight' });
    f.addBinding(p, 'aimLag', { min: 0, max: 3, label: 'Aim Lag' });
    f.addBinding(p, 'forceBehavior', { min: 0, max: 2, step: 1, label: 'Force (0/1c/2a)' });
  }

  /*
    Persists the whole pane state to localStorage so dev tweaks survive reloads
    (a lightweight replacement for dat.gui's named-preset "remember" system).
    Versioned: importing a saved state whose structure no longer matches the pane
    (after bindings/tabs are added/removed) corrupts the layout — bindings shift,
    pages bleed together — so a mismatched/stale blob is discarded instead.
    BUMP TOOLS_STATE_VERSION whenever the pane structure changes.
  */
  persist() {
    const key = 'glory-box:tools-state';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.v === TOOLS_STATE_VERSION && parsed.state) {
          this.pane.importState(parsed.state);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
    this.pane.on('change', () => {
      localStorage.setItem(key, JSON.stringify({
        v: TOOLS_STATE_VERSION,
        state: this.pane.exportState(),
      }));
    });
    this.pane.addButton({ title: 'Reset Tweaks' }).on('click', () => {
      localStorage.removeItem(key);
      window.location.reload();
    });
    // Build/importState leaves non-active tab pages mis-laid-out until they're
    // shown (the "click each tab to fix it" bug). Force it next frame.
    requestAnimationFrame(() => this.relayout());
  }

  // Show every tab page once (then return to the first) — programmatically does
  // what clicking each tab does, so all pages lay out correctly on load.
  relayout() {
    if (!this.tab) { return; }
    const { pages } = this.tab;
    for (let i = 0; i < pages.length; i++) {
      pages[i].selected = true;
    }
    pages[0].selected = true;
  }

  buildPhysicsScreen(obj: any) {
    this.ensureTabs();
    const f1 = this.pages.engine.addFolder({ title: 'Physics', expanded: false });
    f1.addBinding(obj.opts.gravity, 'x', { min: -0.5, max: 0.5, label: 'Gravity X' });
    f1.addBinding(obj.opts.gravity, 'y', { min: -0.5, max: 0.5, label: 'Gravity Y' });
  }

  buildPlayerScreen(obj: any) {
    this.ensureTabs();
    const f1 = this.pages.player;

    f1.addBinding(obj, 'godMode', { label: 'God Mode' });
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
    f0.addBinding(obj, 'usePostProcessing', { label: 'Post Processing' });
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

  // Distribute every material's controls into a "Material" folder on its owning
  // tab (call after the base screens are built). The export button lives in the
  // World tab's Material folder.
  buildMaterials() {
    this.ensureTabs();
    const folders: Record<string, any> = {
      player: this.pages.player.addFolder({ title: 'Material', expanded: false }),
      dragon: this.pages.dragon.addFolder({ title: 'Material', expanded: false }),
      world: this.pages.world.addFolder({ title: 'Material', expanded: false }),
    };
    const matDict = MaterialFactory.getMaterialsByMaterialType();
    Object.keys(matDict).forEach((k) => {
      this.buildMaterialGroup(folders[MATERIAL_TAB[k] || 'world'], k, matDict[k]);
    });
    const exportOutput = { text: '' };
    folders.world.addBinding(exportOutput, 'text', { label: 'Materials Output' });
    const exportFunc = this.exportMaterialsNode.bind(this, exportOutput);
    folders.world.addButton({ title: 'Export Materials Node' }).on('click', exportFunc);
  }

  buildMaterialGroup(parentFolder: any, materialType: any, arr: any) {
    // The dragon's materials read "Enemy*" in the registry but show as "Dragon*".
    const title = String(materialType).replace(/^Enemy/, 'Dragon');
    const rootFolder = parentFolder.addFolder({ title, expanded: false });
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
