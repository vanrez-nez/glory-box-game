
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
      default:
        break;
    }
  }

  addColorField(folder, obj, prop, name) {
    const proxy = { color: obj[prop].toArray() };
    const controller = folder.addColor(proxy, 'color').name(name);
    controller.onChange((v) => {
      obj[prop] = new THREE.Color(
        v[0] / 255, v[1] / 255, v[2] / 255);
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
    const f1 = gui.addFolder('World');

    gui.remember(obj.opts.gravity);
    f1.add(obj.opts.gravity, 'x', -0.5, 0.5).name('Gravity X');
    f1.add(obj.opts.gravity, 'y', -0.5, 0.5).name('Gravity Y');
  }

  buildPlayerScreen(obj) {
    const { gui } = this;
    const f1 = gui.addFolder('Player');

    gui.remember(obj.body.opts);
    f1.add(obj.body.opts, 'mass', 0.01, 1).name('Mass');
    f1.add(obj.body.opts, 'friction', 0.01, 1).name('Friction');

    gui.remember(obj.body.opts.maxVelocity);
    f1.add(obj.body.opts.maxVelocity, 'x', 0.1, 2).name('Max Velocity X');
    f1.add(obj.body.opts.maxVelocity, 'y', 0.1, 2).name('Max Velocity Y');

    gui.remember(obj.opts);
    f1.add(obj.opts, 'walkForce', 0.01, 2).name('Walk Force');
    f1.add(obj.opts, 'jumpForce', 0.01, 2).name('Jump Force');
    // const f2 = gui.addFolder('');
  }

  buildEngineScreen(obj) {
    const { gui } = this;
    const rootFolder = gui.addFolder('Engine');
    const { bloomPass, scene, ambientLight } = obj;
    // Bloom Pass
    const f1 = rootFolder.addFolder('BloomPass');
    gui.remember(obj.bloomPass);
    f1.add(bloomPass, 'strength', 0.5, 4.5).name('Strength');
    f1.add(bloomPass, 'radius', 0, 5).name(' Radius');
    f1.add(bloomPass, 'threshold', 0.1, 1.5).name(' Threshold');
    this.addColorField(f1, bloomPass.highPassUniforms.defaultColor, 'value', 'HighPass Color');
    // Scene
    const f2 = rootFolder.addFolder('Scene');
    f2.add(scene.fog, 'density', 0, 0.095).name('Fog Density');
    this.addColorField(f2, scene.fog, 'color', 'Fog Color');
    // Ambient Light
    const f3 = rootFolder.addFolder('Ambient Light');
    f3.add(ambientLight, 'intensity', 0, 2).name('Intensity');
    this.addColorField(f3, ambientLight, 'color', 'Color');
  }

  buildMapScreen(obj) {
    const { gui } = this;
    const { cylinder, floor, skytube } = obj;
    const rootFolder = gui.addFolder('Map');
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
    // Platform
    const f5 = rootFolder.addFolder('Platform');
    const f6 = f5.addFolder('Static Light Material');
    this.addMaterialFields(f6, LightMatStatic);
    const f7 = f5.addFolder('Moving Light Material');
    this.addMaterialFields(f7, LightMatMoving);
    const f8 = f5.addFolder('Solid Material');
    this.addMaterialFields(f8, GenericMat);
  }
}
