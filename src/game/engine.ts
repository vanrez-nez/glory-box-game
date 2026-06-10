import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CylinderFromCartesian, CylinderToCartesian } from '@/game/utils';

interface EngineOptions {
  canvas?: HTMLCanvasElement | null;
}

const DEFAULT: EngineOptions = {};

export default class Engine {
  opts: EngineOptions;
  width = 0;
  height = 0;
  renderer!: THREE.WebGPURenderer;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  postProcessing?: THREE.RenderPipeline;
  // BloomNode from three/addons/tsl/display/BloomNode; its strength/radius/
  // threshold are TSL uniform nodes (animate via `.value`, see mood-manager).
  bloomPass?: any;
  ambientLight!: THREE.AmbientLight;
  orbitControls!: OrbitControls;
  axesHelper!: THREE.AxesHelper;
  skybox?: THREE.Object3D;
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
      this.initPostProcessing();
    }
    this.cameraOffset = new THREE.Vector3();
    this.cameraTarget = this.scene.position;
    this.cameraTargetTo = new THREE.Vector3();
    // vector to handle camera positions
    this.cameraVector = new THREE.Vector3();
    this.initHelpers();
  }

  /*
    WebGPURenderer initializes its backend asynchronously and must be awaited
    before the first render. Game.init() awaits this before starting the loop.
    We also warm up the render/post-processing pipelines here: the synchronous
    render() the MainLoop calls each frame would otherwise show a black frame
    until the WebGPU pipelines finish compiling asynchronously, which on a fresh
    load lands as a persistent black screen.
  */
  async init() {
    await this.renderer.init();
    const { scene, camera, postProcessing } = this;
    await this.renderer.compileAsync(scene, camera);
    // Warm up the post-processing pipeline once so the first loop frame isn't
    // black while WGSL compiles. Sync render() is valid now that init() resolved.
    if (GameConfig.UsePostProcessing && postProcessing) {
      postProcessing.render();
    }
  }

  // Which backend the renderer actually resolved to — 'WebGPU', or 'WebGL' if
  // three fell back (a common cause of a sudden framerate drop). Valid after
  // init() has run (the backend is created there).
  getBackendName(): string {
    const backend = (this.renderer as any).backend;
    return backend && backend.isWebGPUBackend === true ? 'WebGPU' : 'WebGL';
  }

  initWorld() {
    const { opts } = this;
    this.renderer = new THREE.WebGPURenderer({
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

  /*
    TSL post-processing replacing the legacy EffectComposer chain
    (RenderPass -> FXAA -> UnrealBloomPass -> OutputPass). The scene is rendered
    via a pass node; bloom is extracted from it and composited additively over
    the antialiased scene. PostProcessing applies tone mapping / output encoding,
    matching what OutputPass used to do. Bloom values mirror the old
    UnrealBloomPass tuning (strength 1.5, radius 0.4, threshold 0.85) and may
    need re-tuning since the old LDR-clamp workaround no longer applies.
  */
  initPostProcessing() {
    const { renderer, scene, camera } = this;
    const scenePass = pass(scene, camera);
    // Sample the rendered scene as a texture node (the documented WebGPU pattern);
    // using the PassNode directly renders black on the WebGPU backend.
    const scenePassColor = scenePass.getTextureNode();
    const bloomPass = bloom(scenePassColor, 1.5, 0.4, 0.85);
    this.bloomPass = bloomPass;
    const postProcessing = new THREE.RenderPipeline(renderer);
    // Composite bloom over the scene, then antialias. TSL node math methods
    // (.add) live on the Node prototype at runtime but are absent from the
    // PassTextureNode/BloomNode static types; cast to compose the output.
    postProcessing.outputNode = fxaa((scenePassColor as any).add(bloomPass));
    this.postProcessing = postProcessing;
  }

  initHelpers() {
    const { scene, camera, renderer } = this;
    // Create the orbit camera in developer mode so edit mode (Cmd+E) can toggle it
    // at runtime; it's only active while orbit/static design is on.
    if (GameConfig.developerMode) {
      const c = new OrbitControls(camera, renderer.domElement) as any;
      c.enableDamping = true;
      c.dampingFactor = 0.25;
      c.minDistance = 1;
      c.maxDistance = 1000;
      c.enableKeys = false;
      c.enabled = GameConfig.EnableOrbitControls || GameConfig.StaticDesign;
      this.orbitControls = c;
    }
    if (GameConfig.EnableAxes) {
      this.axesHelper = new THREE.AxesHelper(500);
      scene.add(this.axesHelper);
    }
  }

  // Enable/disable the free orbit camera for edit mode. render() already switches
  // between orbit and followTarget based on GameConfig.StaticDesign.
  setEditMode(on: boolean) {
    if (this.orbitControls) {
      this.orbitControls.enabled = on;
    }
  }

  dispose() {
    this.scene.remove(...this.scene.children);
    this.renderer.dispose();
    this.renderer = null as any;
  }

  resize(w: number, h: number) {
    const { renderer, camera } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // PostProcessing pass nodes read the renderer drawing-buffer size each
    // frame, so no explicit composer resize is required.
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
    // Sit radially behind the player at its actual cylinder angle. Deriving the
    // angle from the player's world position (atan2) keeps the follow seamless
    // across the wrap seam — theta is continuous in 3D as x loops around.
    const [, theta] = CylinderFromCartesian(cameraTarget);
    CylinderToCartesian(cameraVector, GAME.CylinderRadius + GAME.CameraDistance, theta);
    cameraVector.y = cameraTarget.y + 12;
    cameraVector.add(cameraOffset);
    cameraTargetTo.lerp(cameraTarget, 0.1);
    camera.lookAt(cameraTargetTo);
    camera.position.lerp(cameraVector, 0.05);
    cameraOffset.set(0, 0, 0);
  }

  render() {
    const { renderer, scene, camera, postProcessing } = this;
    if (GameConfig.StaticDesign) {
      // Free camera detached from the player: keep the orbit pivot at a fixed
      // point on the cylinder axis so the whole static layout can be inspected.
      this.orbitControls.target.set(0, this.cameraTarget.y, 0);
      this.orbitControls.update();
    } else if (GameConfig.EnableOrbitControls) {
      this.orbitControls.update();
      this.orbitControls.target = this.cameraTarget;
    } else {
      this.followTarget();
    }
    // Keep the skybox centered on the camera so its unit box always encloses the
    // view (it renders behind everything via renderOrder/-depth). Only the
    // position follows — rotation stays world-fixed so the stars don't spin.
    if (this.skybox) {
      this.skybox.position.copy(camera.position);
    }
    // Synchronous render is the supported path now that init() is awaited before
    // the loop starts (renderAsync() is deprecated).
    if (GameConfig.UsePostProcessing && postProcessing) {
      postProcessing.render();
    } else {
      renderer.render(scene, camera);
    }
  }
}
