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
    const geo = new THREE.DodecahedronBufferGeometry(0.8, 1);
    const mat = MaterialFactory.getMaterial('PlayerHudFireball');
    const mesh = new THREE.Mesh(geo, mat);
    this.fireball = mesh;
    this.opts.camera.add(mesh);
  }

  get position() {
    cachedVec.copy(this.fireball.position);
    return this.opts.camera.localToWorld(cachedVec);
  }

  update(delta) {
    const { camera } = this.opts;
    const { fireball } = this;
    const [x, y] = GetScreenCoords(0.5, 1., camera, 20);
    fireball.position.set(x, y, -GAME.HudDistanceFromCamera);
    fireball.rotation.x += delta;
    fireball.material.uniforms.time.value += delta * 0.1;
  }
}
