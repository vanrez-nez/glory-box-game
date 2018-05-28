import { GAME } from './const';
import { GetScreenCoords } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  camera: null,
};

const cachedVec = new THREE.Vector3();

export default class GamePlayerHud {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.loadModel();
    this.addFireballMesh();
  }

  loadModel() {
  }

  addFireballMesh() {
    const geo = new THREE.SphereBufferGeometry(0.8, 8, 8);
    const mat = MaterialFactory.getMaterial('PlayerHudFireball');
    const mesh = new THREE.Mesh(geo, mat);
    this.fireball = mesh;
    this.opts.camera.add(mesh);
  }

  addPowerCollectTweens(tl, amount, color) {
    const { fireball } = this;
    const { uniforms } = fireball.material;
    const scaleTarget = 1 + amount * 0.1;
    tl.to(fireball.scale, 0.25, {
      x: scaleTarget,
      y: scaleTarget,
      z: scaleTarget,
      ease: Back.easeOut,
    });
  }

  resetPower(tl) {
    const { fireball } = this;
    const { uniforms } = fireball.material;
    tl.to(fireball.scale, 0.5, {
      x: 1,
      y: 1,
      z: 1,
    });
  }

  update(delta) {
    const { camera } = this.opts;
    const { fireball } = this;
    const { uniforms } = fireball.material;
    const [x, y] = GetScreenCoords(0.5, 0.5, camera, 20);
    fireball.position.set(x, y, -GAME.HudDistanceFromCamera);
    uniforms.time.value += delta * 0.15;
  }

  get position() {
    cachedVec.copy(this.fireball.position);
    return this.opts.camera.localToWorld(cachedVec);
  }
}
