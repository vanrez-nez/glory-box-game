import { GAME } from './const';
import { MODEL_ASSETS } from './assets';
import { GetScreenCoords } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  camera: null,
};

export default class GameEnemyHud {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.loadModel();
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head');
      this.eyes = scene.getObjectByName('eyes');
      this.initHead();
      this.opts.camera.add(this.head);
      this.modelLoaded = true;
    });
  }

  initHead() {
    const { head, eyes } = this;
    head.scale.multiplyScalar(0.18);
    head.rotation.y = Math.PI * 0.29;
    head.material = MaterialFactory.getMaterial('EnemyHead', {
      name: 'enemy_head',
      color: 0x131e,
    }, 'enemy_head');
    eyes.material = MaterialFactory.getMaterial('EnemyEyes', {
      name: 'enemy_eyes',
      color: 0xffffff,
    }, 'enemy_eyes');
  }

  update(delta) {
    const { camera } = this.opts;
    const { head } = this;
    if (this.modelLoaded) {
      const [x, y] = GetScreenCoords(0.95, 0.5, camera, 20);
      head.position.set(x, y, -GAME.HudDistanceFromCamera);
    }
  }
}
