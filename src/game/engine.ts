import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';

interface EngineOptions {
  canvas?: HTMLCanvasElement | null;
}

const DEFAULT: EngineOptions = {};

export default class Engine {
  opts: EngineOptions;
  width = 0;
  height = 0;
  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  composer!: EffectComposer;
  effectFXAA!: ShaderPass;
  bloomPass!: UnrealBloomPass;
  outputPass!: OutputPass;
  ambientLight!: THREE.AmbientLight;
  orbitControls!: OrbitControls;
  axesHelper!: THREE.AxesHelper;
  cameraOffset!: THREE.Vector3;
  cameraTarget!: THREE.Vector3;
  cameraTargetTo!: THREE.Vector3;
  cameraVector!: THREE.Vector3;

  constructor(opts: Partial<EngineOptions> = {}) {
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
      canvas: opts.canvas ?? undefined,
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
    (globalThis as any).renderer = this.renderer;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.ambientLight = ambientLight;
    this.scene.add(ambientLight);
  }

  initComposer() {
    const { renderer, camera, scene } = this;
    // Before r152 EffectComposer defaulted to an LDR (UnsignedByteType) buffer,
    // which clamps the rendered scene to [0,1] before it reaches the bloom pass.
    // Modern three defaults to an HDR HalfFloat buffer, letting bright sky and
    // emissive values exceed 1.0 so UnrealBloomPass (tuned for the old clamped
    // input) blows the whole frame out. Pin the buffer back to LDR to restore
    // the original bloom response.
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.UnsignedByteType,
    });
    this.composer = new EffectComposer(renderer, renderTarget);
    this.composer.addPass(new RenderPass(scene, camera));
  }

  setupPostProcessing() {
    const { composer } = this;
    const { innerWidth: w, innerHeight: h } = window;
    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms.resolution.value.set(1 / w, 1 / h);
    composer.addPass(this.effectFXAA);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
    composer.addPass(this.bloomPass);
    // EffectComposer renders the scene into a linear HalfFloat buffer; without a
    // final OutputPass the raw linear values are written straight to the canvas
    // (no tone mapping / sRGB encoding), washing the image out and over-blooming.
    // OutputPass applies renderer.toneMapping + sRGB so the post-processed path
    // matches the direct renderer.render() path used at lower quality settings.
    this.outputPass = new OutputPass();
    composer.addPass(this.outputPass);
  }

  initHelpers() {
    const { scene, camera, renderer } = this;
    if (GameConfig.EnableOrbitControls) {
      const c = new OrbitControls(camera, renderer.domElement) as any;
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
    this.renderer = null as any;
  }

  resize(w: number, h: number) {
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
