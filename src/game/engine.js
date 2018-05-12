
import { CONFIG, GAME } from './const';
import { TranslateTo3d } from './utils';
import ObjectCulling from './object-culling';

const DEFAULT = {};

export default class Engine {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.width = 0;
    this.height = 0;
    this.objectCulling = new ObjectCulling({
      maxDistance: GAME.CullingMaxDistance,
      maxVisibleNodes: GAME.CullingMaxNodes,
      updateRate: GAME.CullingUpdateRate,
    });
    this.rebuildCulling = true;
    this.initWorld();
    this.initLights();
    if (CONFIG.UsePostProcessing) {
      this.initComposer();
      this.setupPostProcessing();
    }
    this.cameraTarget = this.scene.position;
    this.cameraTargetTo = new THREE.Vector3();
    // vector to handle camera positions
    this.cameraVector = new THREE.Vector3();
    this.initHelpers();
  }

  initWorld() {
    const { opts } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: !CONFIG.UsePostProcessing,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(1, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 300);
    this.camera.position.z = 200;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.ambientLight = ambientLight;
    this.scene.add(ambientLight);
  }

  initComposer() {
    const { renderer, camera, scene } = this;
    this.composer = new THREE.EffectComposer(renderer);
    this.composer.addPass(new THREE.RenderPass(scene, camera));
  }

  setupPostProcessing() {
    const { composer } = this;
    const { innerWidth: w, innerHeight: h } = window;
    this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    this.effectFXAA.uniforms.resolution.value.set(1 / w, 1 / h);
    composer.addPass(this.effectFXAA);
    this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
    this.bloomPass.renderToScreen = true;
    composer.addPass(this.bloomPass);
  }

  initHelpers() {
    const { scene, camera, renderer } = this;
    const c = new THREE.OrbitControls(camera, renderer.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.25;
    c.minDistance = 1;
    c.maxDistance = 1000;
    c.enableKeys = false;
    c.enabled = CONFIG.EnableOrbitControls;
    this.orbitControls = c;
    this.axesHelper = new THREE.AxesHelper(500);
    scene.add(this.axesHelper);
    this.axesHelper.visible = CONFIG.EnableAxes;
  }

  resize(w, h) {
    const { renderer, camera, composer } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (CONFIG.UsePostProcessing) {
      composer.setSize(w, h);
    }
    this.width = w;
    this.height = h;
  }

  followTarget() {
    const { cameraVector, cameraTargetTo, cameraTarget, camera } = this;
    TranslateTo3d(
      cameraVector.copy(cameraTarget),
      cameraTarget.x * (Math.PI / 1.5),
      cameraTarget.y + 10,
      GAME.CameraDistance,
    );
    cameraTargetTo.lerp(cameraTarget, 0.1);
    camera.lookAt(cameraTargetTo);
    camera.position.lerp(cameraVector, 0.05);
  }

  resetObjectCulling() {
    const { objectCulling, scene } = this;
    objectCulling.add(scene);
    objectCulling.rebuild();
  }

  updateObjectCulling(position) {
    this.objectCulling.updateVisibilityFrom(position);
  }

  render() {
    const { renderer, scene, camera, composer } = this;
    if (CONFIG.EnableOrbitControls) {
      this.orbitControls.update();
      this.orbitControls.target = this.cameraTarget;
    } else {
      this.followTarget();
    }
    if (this.rebuildCulling && CONFIG.PositionCullingEnabled) {
      this.resetObjectCulling();
      this.rebuildCulling = false;
    }
    if (CONFIG.UsePostProcessing) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
}
