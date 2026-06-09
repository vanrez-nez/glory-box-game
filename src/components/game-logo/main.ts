import * as THREE from 'three/webgpu';
import { MeshPhongNodeMaterial } from 'three/webgpu';
import {
  positionWorld, vec3, length, pow, clamp,
} from 'three/tsl';
import { GetScreenSize } from '@/common/three-utils';
import GameLogoRing from '@/components/game-logo/ring';

const DEFAULT = {
  canvasElement: null,
};

export default class GameLogo {
  opts!: Record<string, any>;
  rings!: any[];
  rafHandler!: number;
  renderer!: THREE.WebGPURenderer;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  clock!: THREE.Timer;
  pointLight!: any;
  width!: any;
  height!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.rings = [];
    this.rafHandler = 0;
    this.init();
    this.initLights();
    this.initLightsBackground();
    this.initRings();
  }

  init() {
    const { opts } = this;
    this.renderer = new THREE.WebGPURenderer({
      canvas: opts.canvasElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 300);
    this.camera.position.z = 10;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x170D19);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    this.scene.add(this.camera);
    this.clock = new THREE.Timer();
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const spotLight = new THREE.SpotLight(0xffffff, 0.9, 15, Math.PI / 8, 0.8, 1);
    spotLight.position.z = 10;
    const pointLight = new THREE.PointLight(0xffffff, 5, 25, 9);
    this.pointLight = pointLight;
    pointLight.position.z = 0.5;
    this.scene.add(pointLight, spotLight, ambientLight);
  }

  initLightsBackground() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 10);
    const geo = new THREE.PlaneGeometry(w, h, 1, 1);
    const mat = new MeshPhongNodeMaterial({ color: 0x180E21, transparent: true });
    /*
      TSL port of the old onBeforeCompile light-distance decay. The plane's
      opacity falls off with distance from the point light (world-space distance
      equals the original view-space length). pointLight distance = 25, decay = 9,
      matching initLights().
    */
    const lightWorld = vec3(0, 0, 0.5);
    const lightDistance = length(positionWorld.sub(lightWorld));
    const lightDecay = pow(clamp(lightDistance.div(25).oneMinus(), 0, 1), 9);
    mat.opacityNode = lightDecay.sub(0.25);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
  }

  initRings() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 10);
    const rad = Math.min(w, h) / 2;
    const thickness = 0.25;
    const colors = [
      0xC92E62,
      0x4C4E6E,
      0x422840,
    ];
    const r1 = new GameLogoRing({
      radius: rad * 0.6, depth: 0.4, speed: 1.0, thickness, colors });
    const r2 = new GameLogoRing({
      radius: rad * 0.72, depth: 0.3, speed: -0.7, thickness, colors });
    const r3 = new GameLogoRing({
      radius: rad * 0.84, depth: 0.2, speed: 0.4, thickness, colors });
    this.rings = [r1, r2, r3];
    scene.add(r1.mesh, r2.mesh, r3.mesh);
  }

  resize(w: any, h: any) {
    const { renderer, camera } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    this.width = w;
    this.height = h;
  }

  onFrame() {
    const { clock } = this;
    clock.update();
    const delta = clock.getDelta() * 1000;
    this.rafHandler = requestAnimationFrame(this.onFrame.bind(this));
    this.onUpdate(delta);
  }

  onUpdate(delta: any) {
    const { renderer, scene, camera, rings } = this;
    for (let i = 0; i < rings.length; i++) {
      rings[i].update(delta);
    }
    // WebGPURenderer renders asynchronously; the sync render() renders black
    // after the first frame when driven from a plain rAF loop.
    renderer.renderAsync(scene, camera);
  }

  // WebGPURenderer needs async backend init before the first render.
  async run() {
    this.stop();
    await this.renderer.init();
    this.onFrame();
  }

  stop() {
    cancelAnimationFrame(this.rafHandler);
  }
}
