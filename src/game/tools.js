
import { CONFIG } from './const';
import { LightMatStatic, LightMatMoving, GenericMat } from './platform';

export default class GameTools {
  constructor() {
    this.gui = new dat.GUI({
      load: JSON,
    });
  }

  addScreen(obj, screen) {
    switch (screen) {
      case 'player':
        this.buildPlayerScreen(obj);
        break;
      case 'physics':
        this.buildPhysicsScreen(obj);
        break;
      case 'engine':
        this.buildEngineScreen(obj);
        break;
      case 'map':
        this.buildMapScreen(obj);
        break;
      case 'world':
        this.buildWorldScreen(obj);
        break;
      default:
        break;
    }
  }

  addColorField(folder, obj, prop, name) {
    const proxy = { color: `#${obj[prop].getHexString()}` };
    const controller = folder.addColor(proxy, 'color').name(name);
    const color = obj[prop];
    controller.onChange((v) => {
      color.setHex(v.replace('#', '0x'));
    });
  }

  addMaterialFields(folder, material) {
    this.addColorField(folder, material, 'color', 'Color');
    this.addColorField(folder, material, 'emissive', 'Emissive Color');
    folder.add(material, 'emissiveIntensity', 0, 2).name('Emissive Int');
    folder.add(material, 'opacity', 0, 1).name('Opacity');
    if (material.type === 'MeshStandardMaterial') {
      folder.add(material, 'envMapIntensity', 0, 2).name('Env Map Int');
      folder.add(material, 'metalness', 0, 1).name('Metalness');
      folder.add(material, 'roughness', 0, 1).name('Roughness');
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

    gui.remember(obj.body.opts);
    f1.add(obj.body.opts, 'mass', 0.01, 0.3).name('Mass');
    f1.add(obj.body.opts, 'friction', 0.01, 0.3).name('Friction');

    gui.remember(obj.body.opts.maxVelocity);
    f1.add(obj.body.opts.maxVelocity, 'x', 0.1, 2).name('Max Velocity X');
    f1.add(obj.body.opts.maxVelocity, 'y', 0.1, 2).name('Max Velocity Y');

    gui.remember(obj.opts);
    f1.add(obj.opts, 'gravity', -1, -0.01).name('Ascend Gravity');
    f1.add(obj.opts, 'descentGravity', -1, -0.01).name('Descent Gravity');
    f1.add(obj.opts, 'walkForce', 0.01, 2).name('Walk Force');
    f1.add(obj.opts, 'jumpForce', 0.01, 2).name('Jump Force');
  }

  buildEngineScreen(obj) {
    const { gui } = this;
    const rootFolder = gui.addFolder('Engine');
    const { bloomPass, scene, ambientLight } = obj;
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
    f2.add(scene.fog, 'density', 0, 0.095).name('Fog Density');
    this.addColorField(f2, scene.fog, 'color', 'Fog Color');
    // Ambient Light
    const f3 = rootFolder.addFolder('Ambient Light');
    f3.add(ambientLight, 'intensity', 0, 2).name('Intensity');
    this.addColorField(f3, ambientLight, 'color', 'Color');
  }

  buildWorldScreen(obj) {
    const { gui } = this;
    const { cylinder, floor, skytube } = obj;
    const rootFolder = gui.addFolder('World');
    const f1 = rootFolder.addFolder('Cylinder Material');
    this.addMaterialFields(f1, cylinder.material);
    const f2 = rootFolder.addFolder('Floor Material');
    this.addMaterialFields(f2, floor.material);
    const f3 = rootFolder.addFolder('Skytube Inner Material');
    this.addMaterialFields(f3, skytube.innerCylinder.material);
    // Skytube Shader
    const f4 = rootFolder.addFolder('Skytube Shader');
    const stUniforms = skytube.outterCylinder.material.uniforms;
    this.addColorField(f4, stUniforms.color, 'value', 'Color');
    f4.add(stUniforms.intensity, 'value', 0, 1).name('Intensity');
    f4.add(stUniforms.fade, 'value', 0, 2).name('Fade');
    f4.add(stUniforms.zoom, 'value', 0, 4).name('Zoom');
    f4.add(stUniforms.stepSize, 'value', 0, 1).name('Step Size');
    f4.add(stUniforms.tile, 'value', 0, 1).name('Tile');
    f4.add(stUniforms.transverseSpeed, 'value', 0, 4)
      .name('Transverse Speed');
  }

  buildMapScreen() {
    const { gui } = this;
    const rootFolder = gui.addFolder('Map');
    // Platform
    const f1 = rootFolder.addFolder('Platform');
    const f2 = f1.addFolder('Static Light Material');
    this.addMaterialFields(f2, LightMatStatic);
    const f3 = f1.addFolder('Moving Light Material');
    this.addMaterialFields(f3, LightMatMoving);
    const f4 = f1.addFolder('Solid Material');
    this.addMaterialFields(f4, GenericMat);
  }
}
