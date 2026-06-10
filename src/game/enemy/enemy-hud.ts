import loader from '@/loader';
import { GetScreenCoords } from '@/common/three-utils';
import { GAME } from '@/game/const';
import { MODEL_ASSETS } from '@/game/assets';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';

const DEFAULT = {
  camera: null,
};

export default class GameEnemyHud {
  opts!: Record<string, any>;
  head!: any;
  eyes!: any;
  modelLoaded!: boolean;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.loadModel();
  }

  loadModel() {
    loader.loadModel(MODEL_ASSETS.Dragon).then((gltf) => {
      const scene = (gltf.scenes[0] as any).clone(true);
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

  update() {
    const { camera } = this.opts;
    const { head } = this;
    if (this.modelLoaded) {
      const [x, y] = GetScreenCoords(0.95, 0.5, camera, 20);
      head.position.set(x, y, -GAME.HudDistanceFromCamera);
    }
  }
}
