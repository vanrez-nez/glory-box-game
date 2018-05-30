import { GAME } from './const';
import { MODEL_ASSETS } from './assets';
import { CartesianToCylinder } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import LineTrail from './line-trail';

const DEFAULT = {
  tailSize: 90,
};

export default class GameEnemy {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameEnemy';
    this.speed = 3;
    this.time = 0;
    this.headAmp = 3;
    this.tailPositions = [];
    this.tailSegments = [];
    this.modelLoaded = false;
    this.theta = 0;
    this.positionY = 0;
    this.loadModel();
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head');
      this.eyes = scene.getObjectByName('eyes');
      this.tailSegment = scene.getObjectByName('tail_segment');
      this.group.add(this.head);
      this.initHead();
      this.initTail();
      this.initTrail();
      this.modelLoaded = true;
    });
  }

  initHead() {
    const { head, eyes } = this;
    CartesianToCylinder(this.head.position, 0, 0, GAME.EnemyOffset);
    head.material = MaterialFactory.getMaterial('EnemyHead', {
      name: 'enemy_head',
      color: 0x131e,
    });
    eyes.material = MaterialFactory.getMaterial('EnemyEyes', {
      name: 'enemy_eyes',
      color: 0xffffff,
    });
  }

  initTail() {
    const { group, tailPositions, tailSegments, tailSegment } = this;
    const { tailSize } = this.opts;
    tailSegment.material = MaterialFactory.getMaterial('EnemyArmor', {
      name: 'enemy_armor',
      color: 0x131e,
    });
    tailPositions.push(new THREE.Vector2());
    for (let i = 0; i < tailSize; i++) {
      const t = tailSegment.clone();
      tailSegments.push(t);
      tailPositions.push(new THREE.Vector2(-100, 0, 0));
      group.add(t);
    }
  }

  initTrail() {
    let idx = 0;
    this.trail = new LineTrail({
      maxPositions: this.opts.tailSize,
      material: MaterialFactory.getMaterial('EnemySpine', {
        name: 'enemy_col_trail',
        color: 0xffff00,
        lineWidth: 2,
      }),
      sizeFn: () => {
        const i = idx++ % this.opts.tailSize;
        return this.easeExpoOut(i / this.opts.tailSize);
      },
    });
    this.trail.line.geometry.boundingSphere.radius = 100;
    this.group.add(this.trail.mesh);
  }

  setOrbitPosition(obj, theta) {
    const x = (GAME.CilynderRadius + GAME.EnemyOffset) * Math.sin(theta);
    const y = this.positionY;
    const z = (GAME.CilynderRadius + GAME.EnemyOffset) * Math.cos(theta);
    obj.position.set(x, y, z);
  }

  /*
    Keeps the object facing towards the center, this is a performant
    but simplistic alternative for using THREE.Object3D's lookAt method
    https://stackoverflow.com/questions/1251828/calculate-rotations-to-look-at-a-3d-point
  */
  lookAtCenter(obj, zRotationOffset) {
    const { x, y, z } = obj.position;
    const rotX = Math.atan2(y - this.positionY, z);
    const cosRotX = Math.cos(rotX);
    const rotY = z >= 0 ? -Math.atan2(x * cosRotX, -z) : Math.atan2(x * cosRotX, z);
    const rotZ = Math.atan2(cosRotX, Math.sin(rotX) * Math.sin(rotY));
    obj.rotation.set(rotX, rotY, rotZ + zRotationOffset);
  }

  updateHead() {
    const { positionY, head, headAmp } = this;
    this.setOrbitPosition(this.head, this.theta);
    this.lookAtCenter(head, Math.PI / 4 * 6);
    head.position.y = positionY + Math.cos(this.time) * headAmp;
    /*
      (x) coord of tail positions array are irrelevant to the actual
      mesh position since all calcs for (x) and (z) are made using
      polar coords. Instead, x coords defines the force of the
      sinusoidal motion for the tail.
    */
    this.tailPositions[0].x = this.theta * 6;
    // update first tail position to follow the head
    this.tailPositions[0].y = head.position.y + 0.7;
  }

  /*
    Updates segment position to behave like a chain
    https://processing.org/examples/follow3.html
  */
  getSegmentPosition(idx) {
    const { tailPositions } = this;
    if (idx === 0) {
      return tailPositions[idx];
    } else {
      const prev = tailPositions[idx - 1];
      const pos = tailPositions[idx];
      if (pos && prev) {
        const dx = prev.x - pos.x;
        const dy = prev.y - pos.y;
        const angle = Math.atan2(dy, dx);
        pos.x = prev.x - Math.cos(angle) * 0.5;
        pos.y = prev.y - Math.sin(angle) * 0.5;
      }
      return pos;
    }
  }

  easeExpoIn(t) {
    return t === 0 ? 0 : 1024 ** (t - 1);
  }

  easeExpoOut(t) {
    return t === 1 ? 1 : 1 - (2 ** (-10 * t));
  }

  updateTail() {
    const { tailSegments } = this;
    const len = tailSegments.length;
    for (let i = 0; i < len; i++) {
      const seg = tailSegments[i];
      const pos = this.getSegmentPosition(i);
      const scale = Math.max(0.05, 1.4 - this.easeExpoIn(i / len));
      seg.scale.set(scale, scale, scale);
      const thetaOffset = (i + 1.8) * 0.05;
      this.setOrbitPosition(seg, this.theta - thetaOffset);
      seg.position.y = pos.y;
      this.updateTrailPosition(i, seg.position);
      this.lookAtCenter(seg, Math.PI / 4 * 6);
    }
  }

  updateTrailPosition(idx, position) {
    const { attributes } = this.trail.line;
    const arr = attributes.position.array;
    const offset = arr.length - idx * 6;
    arr[offset - 6] = position.x;
    arr[offset - 5] = position.y;
    arr[offset - 4] = position.z;
    arr[offset - 3] = position.x;
    arr[offset - 2] = position.y;
    arr[offset - 1] = position.z;
    attributes.position.needsUpdate = true;
  }

  updateTrail() {
    this.trail.pushPosition(this.head.position);
  }

  update(delta) {
    if (this.modelLoaded) {
      this.theta += delta * 0.3 * this.speed;
      this.time += delta * this.speed;
      // this.positionY += delta * this.speed * 0.5;
      this.updateHead();
      this.updateTail();
      this.updateTrail(delta);
    }
  }
}
