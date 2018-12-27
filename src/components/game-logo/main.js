import MainLoop from 'mainloop.js';
import { GetScreenSize } from '@/common/three-utils';
import GameLogoRing from './ring';

const DEFAULT = {
  canvasElement: null,
};

export default class GameLogo {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.rings = [];
    this.init();
    this.bind();
    this.initLights();
    this.initBackground();
    this.initOrbitControls();
    this.initRings();
  }

  init() {
    const { opts } = this;
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvasElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.renderReverseSided = true;
    this.renderer.renderSingleSided = true;
    this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap = THREE.PCFShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 300);
    this.camera.position.z = 10;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x170D19);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    this.scene.add(this.camera);
    global.renderer = this.renderer;
  }

  bind() {
    MainLoop.setUpdate(this.onUpdate.bind(this));
    MainLoop.setDraw(this.onDraw.bind(this));
    MainLoop.setEnd(this.onEnd.bind(this));
  }

  resume() {
    MainLoop.start();
  }

  pause() {
    MainLoop.stop();
  }

  initOrbitControls() {
    const { scene, camera } = this;
    const controls = new THREE.OrbitControls(camera);
    scene.add(controls);
    this.controls = controls;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const spotLight = new THREE.SpotLight(0xffffff, 3.5, 20, Math.PI / 9, 0.9, 2);
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    spotLight.position.z = 10;
    this.spotLightHelper = spotLightHelper;
    const pointLight = new THREE.PointLight(0xffffff, 13, 20, 10);
    this.pointLight = pointLight;
    pointLight.castShadow = true;
    pointLight.position.z = 0.13;
    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
    this.scene.add(pointLightHelper, pointLight, spotLight, ambientLight);
  }

  initBackground() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 20);
    const rad = Math.min(w, h) / 2;
    const geo = new THREE.CircleBufferGeometry(rad, 30, 0, Math.PI * 2);
    const mat = new THREE.ShadowMaterial({ color: 0x0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.position.z = 0;
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
    const r1 = new GameLogoRing({ radius: rad * 0.6, thickness, colors, speed: 1.0 });
    const r2 = new GameLogoRing({ radius: rad * 0.7, thickness, colors, speed: -0.7 });
    const r3 = new GameLogoRing({ radius: rad * 0.8, thickness, colors, speed: 0.4 });
    this.rings = [r1, r2, r3];
    scene.add(r1.mesh, r2.mesh, r3.mesh);
  }

  resize(w, h) {
    const { renderer, camera } = this;
    renderer.setSize(w, h);
    camera.clearViewOffset();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    this.width = w;
    this.height = h;
  }

  onUpdate(delta) {
    const { rings, pointLight, clock } = this;
    // pointLight.position.z = Math.sin(clock.getElapsedTime() * 0.5) * 5 + 4;
    for (let i = 0; i < rings.length; i++) {
      rings[i].update(delta);
    }
    if (this.controls) {
      this.controls.update();
      this.spotLightHelper.update();
    }
  }

  onDraw() {
    const { renderer, scene, camera } = this;
    renderer.render(scene, camera);
  }

  onEnd(fps, panic) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
