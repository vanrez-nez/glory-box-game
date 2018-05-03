
import { CONFIG } from './const';
import { TranslateTo3d } from './utils';
import { CRTScreen } from '../shaders/crt-screen';

const DEFAULT = {};

export default class Engine {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.width = 0;
    this.height = 0;
    this.initWorld();
    this.initLights();
    if (CONFIG.UsePostProcessing) {
      this.initComposer();
      this.setupPostProcessing();
    }
    this.cameraTarget = this.scene.position;
    // vector to handle camera positions
    this.cameraVector = new THREE.Vector3();
    this.initHelpers();
  }

  initWorld() {
    const { opts } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(1, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    this.camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
    this.camera.position.z = 95;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
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
    this.crtFx = new THREE.ShaderPass(CRTScreen);
    composer.addPass(this.crtFx);
    // this.crtFx.renderToScreen = true;
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
    const { renderer, camera, composer, crtFx } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (CONFIG.UsePostProcessing) {
      crtFx.uniforms.u_resolution.value = new THREE.Vector2(Math.floor(w / 3), Math.floor(h / 3));
      composer.setSize(w, h);
    }
    this.width = w;
    this.height = h;
  }

  followTarget() {
    const { cameraVector, cameraTarget, camera } = this;
    TranslateTo3d(
      cameraVector.copy(cameraTarget),
      cameraTarget.x * (Math.PI / 1.5),
      cameraTarget.y + 10,
      64,
    );
    camera.lookAt(cameraTarget);
    TweenMax.to(camera.position, 1.5, {
      x: cameraVector.x,
      y: cameraVector.y,
      z: cameraVector.z,
      ease: Power2.easeOut,
    });
  }

  render() {
    const { renderer, scene, camera, composer } = this;
    if (CONFIG.EnableOrbitControls) {
      this.orbitControls.update();
      this.orbitControls.target = this.cameraTarget;
    } else {
      this.followTarget();
    }
    if (CONFIG.UsePostProcessing) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
}
