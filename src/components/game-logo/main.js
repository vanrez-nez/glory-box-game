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
    this.initRings();
  }

  init() {
    const { opts } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvasElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera(65, 1, 1, 300);
    this.camera.position.z = 20;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x170D19);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    this.scene.add(this.camera);
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

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0xff00fc, 0.5);
    this.scene.add(ambientLight);
  }

  initRings() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 20);
    const rad = Math.min(w, h) / 2;
    const thickness = 0.6;
    const colors = [
      0xC92E62,
      0x4C4E6E,
      0x422840,
    ];
    const r1 = new GameLogoRing({ radius: rad * 0.6, thickness, colors, speed: 1.0 });
    const r2 = new GameLogoRing({ radius: rad * 0.7, thickness, colors, speed: 0.7 });
    const r3 = new GameLogoRing({ radius: rad * 0.8, thickness, colors, speed: 0.4 });
    this.rings = [r1, r2, r3];
    scene.add(r1.group, r2.group, r3.group);
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
    const { rings } = this;
    for (let i = 0; i < rings.length; i++) {
      rings[i].update(delta);
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
