import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';

const DEFAULT = {};

export default class Engine {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.width = 0;
    this.height = 0;
    this.initWorld();
    this.initLights();
    if (GameConfig.UsePostProcessing) {
      this.initComposer();
      this.setupPostProcessing();
    }
    this.cameraOffset = new THREE.Vector3();
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
      antialias: !GameConfig.UsePostProcessing,
    });
    const pxRatio = window.devicePixelRatio * GameConfig.PixelRatioMultiplier;
    this.renderer.setPixelRatio(pxRatio);
    this.renderer.setSize(1, 1);
    this.renderer.shadowMap.enabled = GameConfig.EnableShadows;
    this.renderer.sortObjects = false;
    this.renderer.toneMapping = GameConfig.ToneMapping;
    this.scene = new THREE.Scene();
    this.scene.matrixAutoUpdate = true;
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    this.camera = new THREE.PerspectiveCamera(65, 1, 1, 300);
    this.camera.position.z = GAME.ZoomCameraDistance;
    this.scene.add(this.camera);
    global.renderer = this.renderer;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
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
    if (GameConfig.EnableOrbitControls) {
      const c = new THREE.OrbitControls(camera, renderer.domElement);
      c.enableDamping = true;
      c.dampingFactor = 0.25;
      c.minDistance = 1;
      c.maxDistance = 1000;
      c.enableKeys = false;
      this.orbitControls = c;
    }
    if (GameConfig.EnableAxes) {
      this.axesHelper = new THREE.AxesHelper(500);
      scene.add(this.axesHelper);
    }
  }

  dispose() {
    this.scene.remove(...this.scene.children);
    this.renderer.dispose();
    this.renderer = null;
  }

  resize(w, h) {
    const { renderer, camera, composer } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (GameConfig.UsePostProcessing) {
      composer.setSize(w, h);
    }
    this.width = w;
    this.height = h;
  }

  resetCamera() {
    this.cameraOffset.set(0, 0, 0);
    this.cameraTargetTo.set(0, 0, 0);
    this.camera.position.set(0, 30, GAME.ZoomCameraDistance);
  }

  followTarget() {
    const { cameraVector, cameraTargetTo, cameraTarget,
      camera, cameraOffset } = this;
    CartesianToCylinder(
      cameraVector.copy(cameraTarget),
      cameraTarget.x * (Math.PI / 2),
      cameraTarget.y + 12,
      GAME.CameraDistance,
    );
    cameraVector.add(cameraOffset);
    cameraTargetTo.lerp(cameraTarget, 0.1);
    camera.lookAt(cameraTargetTo);
    camera.position.lerp(cameraVector, 0.05);
    cameraOffset.set(0, 0, 0);
  }

  render() {
    const { renderer, scene, camera, composer } = this;
    if (GameConfig.EnableOrbitControls) {
      this.orbitControls.update();
      this.orbitControls.target = this.cameraTarget;
    } else {
      this.followTarget();
    }
    if (GameConfig.UsePostProcessing) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
}
