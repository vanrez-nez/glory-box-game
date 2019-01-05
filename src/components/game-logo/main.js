import { GetScreenSize } from '@/common/three-utils';
import GameLogoRing from '@/components/game-logo/ring';

const DEFAULT = {
  canvasElement: null,
};

export default class GameLogo {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.rings = [];
    this.rafHandler = 0;
    this.init();
    this.initLights();
    this.initLightsBackground();
    this.initShadowsBackground();
    this.initRings();
  }

  init() {
    const { opts } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvasElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 300);
    this.camera.position.z = 10;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x170D19);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    this.scene.add(this.camera);
    this.clock = new THREE.Clock();
    // global.renderer = this.renderer;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const spotLight = new THREE.SpotLight(0xffffff, 0.9, 15, Math.PI / 8, 0.8, 1);
    spotLight.position.z = 10;
    const pointLight = new THREE.PointLight(0xffffff, 5, 25, 9);
    this.pointLight = pointLight;
    pointLight.castShadow = true;
    pointLight.position.z = 0.5;
    this.scene.add(pointLight, spotLight, ambientLight);
  }

  initLightsBackground() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 10);
    const geo = new THREE.PlaneBufferGeometry(w, h, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: 0x180E21, transparent: true });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        `
          // Subtract opacity with light distance decay
          pointLight = pointLights[ 0 ];
          vec3 viewPosition = - vViewPosition;
          float lightDistance = length(pointLight.position - viewPosition);
          float lightDecay = pow( saturate( -lightDistance / pointLight.distance + 1.0 ), pointLight.decay);
          gl_FragColor = vec4(outgoingLight, lightDecay - 0.25);
        `);
    };
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
  }

  initShadowsBackground() {
    const { scene, camera } = this;
    const [w, h] = GetScreenSize(camera, 10);
    const geo = new THREE.PlaneBufferGeometry(w, h, 1, 1);
    const mat = new THREE.ShadowMaterial({ color: 0x0 });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );',
        `
          // Make shadows softer with distance
          vec3 lightToPosition = vPointShadowCoord[ 0 ].xyz;
          float shadowDecay = length(lightToPosition) * 0.25;
          gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask()) - shadowDecay );
        `);
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
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

  resize(w, h) {
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
    const delta = clock.getDelta() * 1000;
    this.rafHandler = requestAnimationFrame(this.onFrame.bind(this));
    this.onUpdate(delta);
  }

  onUpdate(delta) {
    const { renderer, scene, camera, rings } = this;
    for (let i = 0; i < rings.length; i++) {
      rings[i].update(delta);
    }
    renderer.render(scene, camera);
  }

  run() {
    this.stop();
    this.onFrame();
  }

  stop() {
    cancelAnimationFrame(this.rafHandler);
  }
}
